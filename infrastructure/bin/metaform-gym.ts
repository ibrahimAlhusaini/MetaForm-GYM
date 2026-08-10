#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { MetaFormGymStagingStack } from '../lib/metaform-gym-staging-stack.js'
import { STAGING_CONFIG } from '../lib/staging-config.js'

const app = new cdk.App()
const contextValue = (name: string): unknown => app.node.tryGetContext(name)
const stringContext = (name: string): string | undefined => {
  const value = contextValue(name)
  return typeof value === 'string' ? value : undefined
}
const openAiContext = contextValue('metaform:enableOpenAi')
const region =
  stringContext('metaform:region') ??
  process.env.CDK_DEFAULT_REGION ??
  STAGING_CONFIG.region
const enableOpenAi = openAiContext === true || openAiContext === 'true'

new MetaFormGymStagingStack(app, 'MetaFormGymStagingStack', {
  env: { region },
  enableOpenAi,
  openAiSecretArn: stringContext('metaform:openAiSecretArn'),
  aiCoachModel: stringContext('metaform:aiCoachModel'),
  description:
    'MetaForm GYM staging-only container infrastructure (offline CDK preparation)',
})
