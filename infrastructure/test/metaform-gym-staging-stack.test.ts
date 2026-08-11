import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as cdk from 'aws-cdk-lib'
import { Match, Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { MetaFormGymStagingStack } from '../lib/metaform-gym-staging-stack.js'
import { STAGING_CONFIG } from '../lib/staging-config.js'

const app = new cdk.App()
const stack = new MetaFormGymStagingStack(app, 'MetaFormGymStagingStackTest', {
  env: { region: STAGING_CONFIG.region },
})
const template = Template.fromStack(stack)
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

interface CloudFormationResource {
  readonly Properties?: Record<string, unknown>
}

const resourcesOfType = (
  type: string,
): Record<string, CloudFormationResource> => template.findResources(type)

describe('MetaForm GYM staging infrastructure intent', () => {
  it('creates the two-AZ no-NAT VPC', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1)
    template.resourceCountIs('AWS::EC2::NatGateway', 0)
    template.resourceCountIs('AWS::EC2::Subnet', 4)
  })

  it('keeps PostgreSQL private, encrypted, Single-AZ, backed up, and explicit', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      EngineVersion: '18.2',
      DBInstanceClass: 'db.t4g.micro',
      AllocatedStorage: '20',
      StorageType: 'gp3',
      StorageEncrypted: true,
      MultiAZ: false,
      PubliclyAccessible: false,
      BackupRetentionPeriod: 1,
    })
  })

  it('defines an application task with essential Express and non-essential FastAPI', () => {
    template.resourceCountIs('AWS::ECS::TaskDefinition', 2)
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Cpu: '512',
      Memory: '1024',
      NetworkMode: 'awsvpc',
      RequiresCompatibilities: ['FARGATE'],
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'prediction',
          Essential: false,
          PortMappings: Match.arrayWith([
            Match.objectLike({ ContainerPort: 8001 }),
          ]),
        }),
        Match.objectLike({
          Name: 'express',
          Essential: true,
          PortMappings: Match.arrayWith([
            Match.objectLike({ ContainerPort: 3000 }),
          ]),
          Environment: Match.arrayWith([
            {
              Name: 'BODY_WEIGHT_PREDICTION_SERVICE_URL',
              Value: 'http://127.0.0.1:8001',
            },
          ]),
        }),
      ]),
    })
  })

  it('defines a one-off migration task and keeps the service stopped by default', () => {
    template.hasParameter('StagingDesiredCount', {
      Type: 'Number',
      Default: 0,
      AllowedValues: ['0', '1'],
    })
    template.hasResourceProperties('AWS::ECS::TaskDefinition', {
      Family: 'metaform-gym-staging-migration',
      Cpu: '256',
      Memory: '512',
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: 'migration',
          Essential: true,
          Secrets: Match.arrayWith([
            Match.objectLike({ Name: 'DATABASE_HOST' }),
            Match.objectLike({ Name: 'DATABASE_PORT' }),
            Match.objectLike({ Name: 'DATABASE_NAME' }),
            Match.objectLike({ Name: 'DATABASE_USER' }),
            Match.objectLike({ Name: 'DATABASE_PASSWORD' }),
          ]),
        }),
      ]),
    })
    template.hasResourceProperties('AWS::ECS::Service', {
      DesiredCount: { Ref: 'StagingDesiredCount' },
    })
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'metaform-gym-staging-migration-execution',
    })
  })

  it('allows the inactive frontend sentinel only while the service is stopped', () => {
    template.hasParameter('StagingFrontendUrl', {
      Type: 'String',
      Default: 'https://staging.example.invalid',
      AllowedPattern: '^https://[^/]+$',
    })

    const rules = template.toJSON().Rules as Record<string, unknown>
    expect(rules.RequireFrontendUrlWhenServiceEnabled).toEqual({
      RuleCondition: {
        'Fn::Equals': [{ Ref: 'StagingDesiredCount' }, '1'],
      },
      Assertions: [
        {
          Assert: {
            'Fn::Not': [
              {
                'Fn::Equals': [
                  { Ref: 'StagingFrontendUrl' },
                  'https://staging.example.invalid',
                ],
              },
            ],
          },
          AssertDescription:
            'StagingFrontendUrl must be a real HTTPS origin before StagingDesiredCount can be 1.',
        },
      ],
    })

    const equalsOperands: unknown[][] = []
    const collectEqualsOperands = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(collectEqualsOperands)
        return
      }
      if (typeof value !== 'object' || value === null) return

      for (const [key, child] of Object.entries(value)) {
        if (key === 'Fn::Equals') {
          expect(Array.isArray(child)).toBe(true)
          equalsOperands.push(child as unknown[])
        }
        collectEqualsOperands(child)
      }
    }

    collectEqualsOperands(rules.RequireFrontendUrlWhenServiceEnabled)
    expect(equalsOperands).toHaveLength(2)
    for (const operands of equalsOperands) {
      expect(operands).toHaveLength(2)
      expect(operands.some((operand) => typeof operand === 'number')).toBe(
        false,
      )
    }
  })

  it('assigns a public IP without granting direct task ingress', () => {
    template.hasResourceProperties('AWS::ECS::Service', {
      NetworkConfiguration: {
        AwsvpcConfiguration: Match.objectLike({ AssignPublicIp: 'ENABLED' }),
      },
      LoadBalancers: [
        Match.objectLike({ ContainerName: 'express', ContainerPort: 3000 }),
      ],
    })
    const ingress = resourcesOfType('AWS::EC2::SecurityGroupIngress')
    expect(JSON.stringify(ingress)).not.toContain('8001')
    const apiRules = Object.values(ingress).filter(
      (resource) => resource.Properties?.FromPort === 3000,
    )
    expect(apiRules).toHaveLength(1)
    expect(apiRules[0]?.Properties).toHaveProperty('SourceSecurityGroupId')
    expect(apiRules[0]?.Properties).not.toHaveProperty('CidrIp')
  })

  it('targets only Express and uses independent API health', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 1)
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 3000,
      HealthCheckPath: '/api/v1/health',
    })
    expect(
      JSON.stringify(
        template.findResources('AWS::ElasticLoadBalancingV2::TargetGroup'),
      ),
    ).not.toContain('8001')
  })

  it('allows database ingress only from the ECS security boundary', () => {
    const ingress = resourcesOfType('AWS::EC2::SecurityGroupIngress')
    const postgresRules = Object.values(ingress).filter(
      (resource) => resource.Properties?.FromPort === 5432,
    )
    expect(postgresRules).toHaveLength(1)
    expect(postgresRules[0]?.Properties).toHaveProperty('SourceSecurityGroupId')
    expect(postgresRules[0]?.Properties).not.toHaveProperty('CidrIp')
  })

  it('bounds both staging log groups to fourteen days', () => {
    template.resourceCountIs('AWS::Logs::LogGroup', 2)
    template.allResourcesProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 14,
    })
  })

  it('injects deploy-time secret references without literal credentials', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 3)
    const tasks = template.findResources('AWS::ECS::TaskDefinition')
    const serialized = JSON.stringify(tasks)
    for (const name of [
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_NAME',
      'DATABASE_USER',
      'DATABASE_PASSWORD',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
    ]) {
      expect(serialized).toContain(name)
    }
    expect(serialized).not.toMatch(/postgresql:\/\/[^"]+:[^@"]+@/)
  })

  it('uses the Frankfurt staging default and contains no production-named resources', () => {
    expect(STAGING_CONFIG.region).toBe('eu-central-1')
    const cdkConfig = JSON.parse(
      fs.readFileSync(path.resolve(currentDirectory, '../cdk.json'), 'utf8'),
    ) as { context: Record<string, unknown> }
    expect(cdkConfig.context['metaform:region']).toBe('eu-central-1')

    const resources = template.toJSON().Resources as Record<
      string,
      { Properties?: Record<string, unknown> }
    >
    const explicitNames = JSON.stringify(resources).match(
      /metaform-gym-[a-z0-9-]+/g,
    )
    expect(explicitNames?.every((name) => name.includes('staging'))).toBe(true)
  })
})
