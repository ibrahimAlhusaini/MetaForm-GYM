import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CfnOutput,
  CfnParameter,
  CfnRule,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  type StackProps,
} from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'
import { STAGING_CONFIG } from './staging-config.js'

export interface MetaFormGymStagingStackProps extends StackProps {
  readonly enableOpenAi?: boolean
  readonly openAiSecretArn?: string
  readonly aiCoachModel?: string
}

export class MetaFormGymStagingStack extends Stack {
  public constructor(
    scope: Construct,
    id: string,
    props: MetaFormGymStagingStackProps = {},
  ) {
    super(scope, id, props)

    const inactiveFrontendUrl = 'https://staging.example.invalid'
    const frontendUrl = new CfnParameter(this, 'StagingFrontendUrl', {
      type: 'String',
      default: inactiveFrontendUrl,
      description:
        'Exact HTTPS staging frontend origin. The non-routable default is allowed only while desired count is 0.',
      allowedPattern: '^https://[^/]+$',
    })
    const desiredCount = new CfnParameter(this, 'StagingDesiredCount', {
      type: 'Number',
      default: 0,
      allowedValues: ['0', '1'],
      description:
        'Keep at 0 until the one-off staging migration task succeeds; set to 1 in a subsequent deployment.',
    })
    new CfnRule(this, 'RequireFrontendUrlWhenServiceEnabled', {
      ruleCondition: Fn.conditionEquals(desiredCount.valueAsString, '1'),
      assertions: [
        {
          assert: Fn.conditionNot(
            Fn.conditionEquals(
              frontendUrl.valueAsString,
              inactiveFrontendUrl,
            ),
          ),
          assertDescription:
            'StagingFrontendUrl must be a real HTTPS origin before StagingDesiredCount can be 1.',
        },
      ],
    })

    const vpc = new ec2.Vpc(this, 'StagingVpc', {
      vpcName: 'metaform-gym-staging-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.40.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    })

    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      'StagingAlbSecurityGroup',
      {
        vpc,
        securityGroupName: 'metaform-gym-staging-alb',
        description: 'Public HTTP ingress for the staging ALB only',
        allowAllOutbound: false,
      },
    )
    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      'StagingEcsSecurityGroup',
      {
        vpc,
        securityGroupName: 'metaform-gym-staging-ecs',
        description: 'Staging task ingress only from the ALB on the API port',
        allowAllOutbound: false,
      },
    )
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'StagingDatabaseSecurityGroup',
      {
        vpc,
        securityGroupName: 'metaform-gym-staging-database',
        description: 'Staging PostgreSQL ingress only from ECS tasks',
        allowAllOutbound: false,
      },
    )

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Temporary staging HTTP listener; add ACM HTTPS before acceptance',
    )
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(STAGING_CONFIG.apiPort),
      'ALB to Express only',
    )
    albSecurityGroup.addEgressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(STAGING_CONFIG.apiPort),
      'Express targets only',
    )
    databaseSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(STAGING_CONFIG.databasePort),
      'ECS tasks to PostgreSQL only',
    )
    ecsSecurityGroup.addEgressRule(
      databaseSecurityGroup,
      ec2.Port.tcp(STAGING_CONFIG.databasePort),
      'PostgreSQL only to the staging database boundary',
    )
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS egress for ECR, AWS APIs, and optional OpenAI',
    )
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('10.40.0.0/16'),
      ec2.Port.udp(53),
      'VPC DNS resolution',
    )
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('10.40.0.0/16'),
      ec2.Port.tcp(53),
      'VPC DNS fallback',
    )

    const database = new rds.DatabaseInstance(this, 'StagingDatabase', {
      databaseName: STAGING_CONFIG.databaseName,
      instanceIdentifier: 'metaform-gym-staging-postgres',
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_18_2,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('metaform_app'),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.MICRO,
      ),
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: false,
      publiclyAccessible: false,
      backupRetention: Duration.days(STAGING_CONFIG.backupDays),
      deleteAutomatedBackups: false,
      deletionProtection: false,
      autoMinorVersionUpgrade: true,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [databaseSecurityGroup],
      removalPolicy: RemovalPolicy.SNAPSHOT,
    })

    const jwtAccessSecret = new secretsmanager.Secret(
      this,
      'StagingJwtAccessSecret',
      {
        secretName: 'metaform-gym/staging/jwt-access',
        description: 'Deploy-time-generated staging JWT access signing secret',
        generateSecretString: {
          passwordLength: 64,
          excludePunctuation: false,
        },
      },
    )
    const jwtRefreshSecret = new secretsmanager.Secret(
      this,
      'StagingJwtRefreshSecret',
      {
        secretName: 'metaform-gym/staging/jwt-refresh',
        description: 'Deploy-time-generated staging JWT refresh signing secret',
        generateSecretString: {
          passwordLength: 64,
          excludePunctuation: false,
        },
      },
    )

    const cluster = new ecs.Cluster(this, 'StagingCluster', {
      vpc,
      clusterName: 'metaform-gym-staging',
      containerInsightsV2: ecs.ContainerInsights.DISABLED,
    })
    const executionRole = new iam.Role(this, 'StagingTaskExecutionRole', {
      roleName: 'metaform-gym-staging-task-execution',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    })
    const taskRole = new iam.Role(this, 'StagingTaskRole', {
      roleName: 'metaform-gym-staging-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'No application AWS permissions are granted by default',
    })
    const migrationExecutionRole = new iam.Role(
      this,
      'StagingMigrationExecutionRole',
      {
        roleName: 'metaform-gym-staging-migration-execution',
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy',
          ),
        ],
      },
    )
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'StagingTaskDefinition',
      {
        family: 'metaform-gym-staging',
        cpu: STAGING_CONFIG.taskCpu,
        memoryLimitMiB: STAGING_CONFIG.taskMemoryMiB,
        executionRole,
        taskRole,
      },
    )

    const apiLogGroup = new logs.LogGroup(this, 'StagingExpressLogGroup', {
      logGroupName: '/metaform-gym/staging/express',
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    })
    const predictionLogGroup = new logs.LogGroup(
      this,
      'StagingPredictionLogGroup',
      {
        logGroupName: '/metaform-gym/staging/prediction',
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    )

    const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
    const repositoryRoot = path.resolve(currentDirectory, '../..')
    const prediction = taskDefinition.addContainer('prediction', {
      containerName: 'prediction',
      image: ecs.ContainerImage.fromAsset(
        path.join(repositoryRoot, 'data-science'),
        { file: 'Dockerfile' },
      ),
      essential: false,
      cpu: 256,
      memoryReservationMiB: 384,
      logging: ecs.LogDrivers.awsLogs({
        logGroup: predictionLogGroup,
        streamPrefix: 'prediction',
      }),
      healthCheck: {
        command: [
          'CMD',
          'python',
          '-c',
          "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health', timeout=2)",
        ],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(20),
      },
    })
    prediction.addPortMappings({
      name: 'prediction-internal',
      containerPort: STAGING_CONFIG.predictionPort,
      protocol: ecs.Protocol.TCP,
    })

    const databaseSecret = database.secret
    if (!databaseSecret) {
      throw new Error('RDS generated secret was not created')
    }
    const databaseSecrets: Record<string, ecs.Secret> = {
      DATABASE_HOST: ecs.Secret.fromSecretsManager(databaseSecret, 'host'),
      DATABASE_PORT: ecs.Secret.fromSecretsManager(databaseSecret, 'port'),
      DATABASE_NAME: ecs.Secret.fromSecretsManager(databaseSecret, 'dbname'),
      DATABASE_USER: ecs.Secret.fromSecretsManager(databaseSecret, 'username'),
      DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(
        databaseSecret,
        'password',
      ),
    }
    const apiSecrets: Record<string, ecs.Secret> = {
      ...databaseSecrets,
      JWT_ACCESS_SECRET: ecs.Secret.fromSecretsManager(jwtAccessSecret),
      JWT_REFRESH_SECRET: ecs.Secret.fromSecretsManager(jwtRefreshSecret),
    }
    const apiEnvironment: Record<string, string> = {
      NODE_ENV: 'production',
      PORT: String(STAGING_CONFIG.apiPort),
      FRONTEND_URL: frontendUrl.valueAsString,
      BODY_WEIGHT_PREDICTION_SERVICE_URL: `http://127.0.0.1:${String(STAGING_CONFIG.predictionPort)}`,
      BODY_WEIGHT_PREDICTION_TIMEOUT_MS: '2000',
    }

    if (props.enableOpenAi) {
      if (!props.openAiSecretArn || !props.aiCoachModel) {
        throw new Error(
          'OpenAI requires both metaform:openAiSecretArn and metaform:aiCoachModel context values',
        )
      }
      const openAiSecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'StagingOpenAiSecret',
        props.openAiSecretArn,
      )
      apiSecrets.OPENAI_API_KEY = ecs.Secret.fromSecretsManager(openAiSecret)
      apiEnvironment.AI_COACH_MODEL = props.aiCoachModel
    }

    const api = taskDefinition.addContainer('express', {
      containerName: 'express',
      image: ecs.ContainerImage.fromAsset(repositoryRoot, {
        file: 'apps/api/Dockerfile',
      }),
      essential: true,
      cpu: 256,
      memoryReservationMiB: 512,
      environment: apiEnvironment,
      secrets: apiSecrets,
      logging: ecs.LogDrivers.awsLogs({
        logGroup: apiLogGroup,
        streamPrefix: 'express',
      }),
      stopTimeout: Duration.seconds(15),
    })
    api.addPortMappings({
      name: 'express-http',
      containerPort: STAGING_CONFIG.apiPort,
      protocol: ecs.Protocol.TCP,
      appProtocol: ecs.AppProtocol.http,
    })
    api.addContainerDependencies({
      container: prediction,
      condition: ecs.ContainerDependencyCondition.START,
    })

    const migrationTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'StagingMigrationTaskDefinition',
      {
        family: 'metaform-gym-staging-migration',
        cpu: 256,
        memoryLimitMiB: 512,
        executionRole: migrationExecutionRole,
        taskRole,
      },
    )
    migrationTaskDefinition.addContainer('migration', {
      containerName: 'migration',
      image: ecs.ContainerImage.fromAsset(repositoryRoot, {
        file: 'apps/api/Dockerfile',
        target: 'migration',
      }),
      essential: true,
      cpu: 256,
      memoryReservationMiB: 384,
      secrets: databaseSecrets,
      logging: ecs.LogDrivers.awsLogs({
        logGroup: apiLogGroup,
        streamPrefix: 'migration',
      }),
    })

    const service = new ecs.FargateService(this, 'StagingService', {
      serviceName: 'metaform-gym-staging',
      cluster,
      taskDefinition,
      desiredCount: desiredCount.valueAsNumber,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [ecsSecurityGroup],
      circuitBreaker: { rollback: true },
      healthCheckGracePeriod: Duration.seconds(60),
      minHealthyPercent: 0,
      maxHealthyPercent: 200,
    })

    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'StagingLoadBalancer',
      {
        loadBalancerName: 'metaform-gym-staging',
        vpc,
        internetFacing: true,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        securityGroup: albSecurityGroup,
      },
    )
    const listener = loadBalancer.addListener('StagingHttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: false,
    })
    listener.addTargets('StagingExpressTargets', {
      port: STAGING_CONFIG.apiPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        service.loadBalancerTarget({
          containerName: 'express',
          containerPort: STAGING_CONFIG.apiPort,
        }),
      ],
      healthCheck: {
        path: '/api/v1/health',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
      },
      deregistrationDelay: Duration.seconds(15),
    })

    new CfnOutput(this, 'StagingAlbDnsName', {
      value: loadBalancer.loadBalancerDnsName,
      description:
        'HTTP-only preparation endpoint; do not accept staging publicly before ACM HTTPS.',
    })
    new CfnOutput(this, 'StagingClusterName', {
      value: cluster.clusterName,
      description: 'Cluster used by the service and one-off migration task.',
    })
    new CfnOutput(this, 'StagingMigrationTaskDefinitionArn', {
      value: migrationTaskDefinition.taskDefinitionArn,
      description:
        'Task definition to run exactly once before enabling the staging service.',
    })
    new CfnOutput(this, 'StagingEcsSecurityGroupId', {
      value: ecsSecurityGroup.securityGroupId,
      description: 'Security group required by the one-off migration task.',
    })
    new CfnOutput(this, 'StagingPublicSubnetIds', {
      value: Fn.join(
        ',',
        vpc.publicSubnets.map((subnet) => subnet.subnetId),
      ),
      description:
        'Public subnets for the migration task; assign a public IP for AWS API and ECR access.',
    })
  }
}
