const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

const sns = new AWS.SNS()
const TOPIC_ARN = '/* TODO: Add your topic arn */'

function publish (msg) {
  const params = {
    TopicArn: TOPIC_ARN,
    Message: msg
  }

  return new Promise((resolve, reject) => {
    sns.public(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

module.exports = { publish }
