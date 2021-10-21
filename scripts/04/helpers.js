const AWS = require('aws-sdk')

// Declare local variables
const ec2SgName = 'hamster_sg'

function createSecurityGroup (sgName, port) {
  return new Promise((resolve, reject) => {
    const ec2 = new AWS.EC2()
    const params = {
      Description: sgName,
      GroupName: sgName
    }

    ec2.createSecurityGroup(params, (err, data) => {
      if (err) reject(err)
      else {
        const newSgId = data.GroupId
        const params = {
          GroupId: newSgId,
          IpPermissions: [
            {
              IpProtocol: 'tcp',
              FromPort: port,
              ToPort: port,
              IpRanges: [
                {
                  CidrIp: '72.182.3.87/32'
                }
              ]
            }
          ]
        }
        ec2.authorizeSecurityGroupIngress(params, (err, data) => {
          if (err) reject(err)
          else {
            getSecurityGroupId(ec2SgName)
            .then((ec2SgId) => {
              const params = {
                GroupId: ec2SgId,
                IpPermissions: [
                  {
                    IpProtocol: '-1',
                    UserIdGroupPairs: [
                      {
                        GroupId: newSgId,
                      }
                    ]
                  }
                ]
              }
              // Attach the new security group just created to the ec2 hamster sg
              ec2.authorizeSecurityGroupIngress(params, (err, data) => {
                if (err) reject(err)
                // return the GroupId of the newly created security group above
                else resolve(newSgId)
              })
            })
          }
        })
      }
    })
  })
}

function getSecurityGroupId (sgName) {
  const params = {
    Filters: [
      {
        Name: 'group-name',
        Values:[
          sgName
        ]
      }
    ]
  }

  return new Promise((resolve, reject) => {
    const ec2 = new AWS.EC2()
    ec2.describeSecurityGroups(params, (err, data) => {
      if (err) reject(err)
      else {
        const [ securityGroup ] = data.SecurityGroups
        resolve(securityGroup.GroupId)
      }
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
          // PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
          // TODO: NEED TO WORK OUT ATTACHING ALL THESE POLICIES, BELOW CODE WON'T WORK WITH MULTIPILES
          PolicyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          PolicyArn: 'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          PolicyArn: 'arn:aws:iam::aws:policy/AmazonRDSFullAccess',
          PolicyArn: 'arn:aws:iam::aws:policy/AmazonElastiCacheFullAccess',
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

module.exports = {
  createIamRole,
  getSecurityGroupId,
  createSecurityGroup
}
