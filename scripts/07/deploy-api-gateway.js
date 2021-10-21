// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
const apiG = new AWS.APIGateway()
const apiId = 'u4y38ku1s4'

createDeployment(apiId, 'prod')
.then(data => console.log(data))

function createDeployment (apiId, stageName) {
  const params = {
    restApiId: apiId,
    stageName: stageName
  }

  return new Promise((resolve, reject) => {
    apiG.createDeployment(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
