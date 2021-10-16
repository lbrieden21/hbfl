// Imports
const AWS = require('aws-sdk')
const helpers = require('./helpers')

AWS.config.update({ region: 'us-east-1' })

// Declare local variables
const ec2 = new AWS.EC2()
const sgName = 'hamster_sg'
const keyName = 'hamster_key'

// Do all the things together
createSecurityGroup(sgName)
.then(() => {
  return createKeyPair(keyName)
})
.then((data) => {
  if ('KeyMaterial' in data)
    helpers.persistKeyPair(data)
})
.then(() => {
  return createInstance(sgName, keyName)
})
.then((data) => {
  console.log('Created instance with:', data)
})
.catch((err) => {
  console.error('Failed to create the instance with:', err)
})
// async function execute () {
//   try {
//     await createSecurityGroup(sgName)
//     const keyPair = await createKeyPair(keyName)
//     await helpers.persistKeyPair(keyPair)
//     const data = await createInstance(sgName, keyName)
//     console.log('Created instance with:', data)
//   } catch (err) {
//     console.error('Failed to create instance with:', err)
//   }
// }

// Create functions
async function createSecurityGroup (sgName) {
  const params = {
    Description: sgName,
    GroupName: sgName
  }

  return new Promise((resolve, reject) => {
    ec2.createSecurityGroup(params, (err, data) => {
      if (err) {
        if (err.code == 'InvalidGroup.Duplicate') {
          console.log('Security group already exists, skipping creation')
          resolve()
        } else {
          reject(err)
        }
      } else {
        const params = {
          GroupId: data.GroupId,
          IpPermissions: [
            {
              IpProtocol: 'tcp',
              FromPort: 22,
              ToPort: 22,
              IpRanges: [
                {
                  CidrIp: '72.182.3.87/32'
                }
              ]
            },
            {
              IpProtocol: 'tcp',
              FromPort: 3000,
              ToPort: 3000,
              IpRanges: [
                {
                  CidrIp: '72.182.3.87/32'
                }
              ]
            }
          ]
        }
        ec2.authorizeSecurityGroupIngress(params, (err) => {
          if (err) reject (err)
          else resolve()
        })
      }
    })
  })
}

async function createKeyPair (keyName) {
  const params = {
    KeyName: keyName
  }

  return new Promise((resolve, reject) => {
    ec2.createKeyPair(params, (err, data) => {
      if (err) {
        if (err.code == 'InvalidKeyPair.Duplicate') {
          console.log('KeyPair already exists, skipping creation')
          resolve(params)
        } else {
          reject(err)
        }
      } else {
        resolve(data)
      }
    })
  })
}

async function createInstance (sgName, keyName) {
  const params = {
    ImageId: 'ami-02e136e904f3da870',
    InstanceType: 't2.micro',
    KeyName: keyName,
    MaxCount: 1,
    MinCount: 1,
    SecurityGroups: [
      sgName
    ],
    UserData: 'IyEvYmluL2Jhc2gKY3VybCAtLXNpbGVudCAtLWxvY2F0aW9uIGh0dHBzOi8vcnBtLm5vZGVzb3VyY2UuY29tL3NldHVwXzE2LnggfCBzdWRvIGJhc2ggLQpzdWRvIHl1bSBpbnN0YWxsIC15IG5vZGVqcyBnaXQKZ2l0IGNsb25lIGh0dHBzOi8vZ2l0aHViLmNvbS9yeWFubXVyYWthbWkvaGJmbC5naXQgL2hvbWUvZWMyLXVzZXIvaGJmbApjZCAvaG9tZS9lYzItdXNlci9oYmZsCnN1ZG8gbnBtIGkKbnBtIHJ1biBzdGFydA=='
  }

  return new Promise((resolve, reject) => {
    ec2.runInstances(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
