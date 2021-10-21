// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
const apiG = new AWS.APIGateway()
const apiName = 'hamster-api'
const roleName = 'hamsterAGRole'
const apiPolicy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}

let apiData

// createIamRole(roleName)
// .then(profileArn => createRestApi(apiName, profileArn))
createRestApi(apiName)
.then((data) => {
  apiData = data
  return getRootResource(apiData)
})
.then(rootResourceId => createResource(rootResourceId, 'hbfl', apiData))
.then(hbflResourceId => createResourceMethod(hbflResourceId, 'GET', apiData))
.then(hbflResourceId => createMethodIntegration(hbflResourceId, 'GET', apiData))
.then(hbflResourceId => createResource(hbflResourceId, '{proxy+}', apiData))
.then(proxyResourceId => createResourceMethod(proxyResourceId, 'ANY', apiData, 'proxy'))
.then(proxyResourceId => createMethodIntegration(proxyResourceId, 'ANY', apiData, 'proxy'))
.then(data => console.log(data))

function createRestApi (apiName, policy) {
  const params = {
    name: apiName,
    // policy: JSON.stringify(apiPolicy)
  }

  return new Promise((resolve, reject) => {
    apiG.createRestApi(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

function getRootResource (api) {
  const params = {
    restApiId: api.id
  }

  return new Promise((resolve, reject) => {
    apiG.getResources(params, (err, data) => {
      if (err) reject(err)
      else {
        const rootResource = data.items.find(r => r.path === '/')
        resolve(rootResource.id)
      }
    })
  })
}

function createResource (parentResourceId, resourcePath, api) {
  const params = {
    parentId: parentResourceId,
    pathPart: resourcePath,
    restApiId: api.id
  }

  return new Promise((resolve, reject) => {
    apiG.createResource(params, (err, data) => {
      if (err) reject(err)
      else resolve(data.id)
    })
  })
}

function createResourceMethod (resourceId, method, api, path) {
  const params = {
    authorizationType: 'NONE',
    httpMethod: method,
    resourceId: resourceId,
    restApiId: api.id
  }

  if (path) {
    params.requestParameters = {
      [`method.request.path.${path}`]: true
    }
  }

  return new Promise((resolve, reject) => {
    apiG.putMethod(params, (err) => {
      if (err) reject(err)
      else resolve(resourceId)
    })
  })
}

function createMethodIntegration (resourceId, method, api, path) {
  const params = {
    httpMethod: method,
    resourceId: resourceId,
    restApiId: api.id,
    integrationHttpMethod: method,
    type: 'HTTP_PROXY',
    uri: 'http://hamsterELB-35544123.us-east-1.elb.amazonaws.com'
  }

  if (path) {
    params.uri += `/{${path}}`
    params.requestParameters = {
      [`integration.request.path.${path}`]: `method.request.path.${path}`
    }
  }

  return new Promise((resolve, reject) => {
    apiG.putIntegration(params, (err) => {
      if (err) reject(err)
      else resolve(resourceId)
    })
  })
}

function createIamRole (roleName) {
  const profileName = `${roleName}_profile`
  const iam = new AWS.IAM()
  const params = {
    RoleName: roleName,
    AssumeRolePolicyDocument: '{ "Version": "2012-10-17", "Statement": [ { "Effect": "Allow", "Principal": { "Service": "ec2.amazonaws.com" }, "Action": "sts:AssumeRole" } ] }'
  }

  return new Promise((resolve, reject) => {
    iam.createRole(params, (err) => {
      if (err) reject(err)
      else {
        const params = {
          PolicyArn: 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
          RoleName: roleName
        }

        iam.attachRolePolicy(params, (err) => {
          if (err) reject(err)
          else {
            iam.createInstanceProfile({ InstanceProfileName: profileName }, (err, iData) => {
              if (err) reject(err)
              else {
                const params = {
                  InstanceProfileName: profileName,
                  RoleName: roleName
                }
                iam.addRoleToInstanceProfile(params, (err) => {
                  if (err) reject(err)
                  else {
                    // Profile creation is slow, need to wait
                    setTimeout(() => resolve(iData.InstanceProfile.Arn), 10000)
                  }
                })
              }
            })
          }
        })
      }
    })
  })
}

