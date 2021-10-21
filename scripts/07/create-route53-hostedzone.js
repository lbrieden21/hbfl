// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
// TODO: Create route53 object
const hzName = 'CHANGEME'

createHostedZone(hzName)
.then(data => console.log(data))

function createHostedZone (hzName) {
  const parmas = {
    Name: hzName,
    CallerReference: `${Date.now()}`
  }

  return new Promise((resolve, reject) => {
    route53.createHostedZone(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
