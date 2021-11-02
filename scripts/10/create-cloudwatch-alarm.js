// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
const cw = new AWS.CloudWatch()
const alarmName = 'hamster-elb-alarm'
const topicArn = '/* TODO: Add your SNS topic ARN */'
const tg = '/* TODO: Add last part of Target Group ARN */'
const lb = '/* TODO: Add last part of Load Balancer ARN */'

createCloudWatchAlarm(alarmName, topicArn, tg, lb)
.then(data => console.log(data))

function createCloudWatchAlarm (alarmName, topicArn, tg, lb) {
  const params = {
    AlarmName: alarmName,
    ComparisonOperatior: 'LessThanThreshold',
    EvaluationPeriods: 1,
    MetricName: 'HealthyHostCount',
    Namespace: 'AWS/ApplicationELB',
    Period: 60,
    Threshold: 1,
    AlarmActions: [
      topicArn
    ],
    Dimesions: [
      {
        Name: 'TargetGroup',
        Value: tg
      }, {
        Name: 'LoadBalancer',
        Value: lb
      }
    ],
    Statistics: 'Average',
    TreatMissingData: 'breaching'
  }

  return new Promise((resolve, reject) => {
    cw.putMetricAlarm(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
