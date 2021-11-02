// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
const sns = new AWS.SNS()
const type = 'sms'
const endpoint = '/* TODO: Add your mobile number with country code */'
const topicArn = '/* TODO: Add your sns topic arn */'

createSubscription(type, topicArn, endpoint)
.then(data => console.log(data))

function createSubscription (type, topicArn, endpoint) {
  const params = {
    Protocol: type,
    TopicArn: topicArn,
    Endpoint: endpoint
  }

  return new Promise((resolve, reject) => {
    sns.createSubscription(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
