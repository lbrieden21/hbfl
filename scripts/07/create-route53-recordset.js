// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
const route53 = new AWS.Route53()
const hzId = 'CHANGEME' // '/hostedzone/SOMETHING' gotten from running create-route53-hostedzone.js

createRecordSet(hzId)
.then(data => console.log(data))

function createRecordSet (hzId) {
  const params = {
    HostedZoneId: hzId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'CREATE',
          ResourceRecordSet: {
            Name: 'CHANGEME', // Should be same as hosted zone in create-route53-hostedzone.js
            Type: 'A',
            AliasTarget: {
              DNSName: 'hamsterELB-35544123.us-east-1.elb.amazonaws.com', // internal AWS DNS name
              EvaluateTargetHealth: false,
              // Link to ELB Regions:
              // https://docs.aws.amazon.com/general/latest/gr/elb.html
              HostedZoneId: 'Z35SXDOTRQ7X7K' // The HostedZoneId of the Elastic Load Balancer
            }
          }
        }
      ]
    }
  }

  return new Promise((resolve, reject) => {
    route53.changeResourceRecordSets(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
