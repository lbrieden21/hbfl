// Imports
const AWS = require('aws-sdk')

AWS.config.update({ region: 'us-east-1' })

const ec2 = new AWS.EC2()
const rds = new AWS.RDS()
const dbName = 'user'
const ec2SgName = 'hamster_sg'

createSecurityGroup(dbName)
.then(sgId => createDatabase(dbName, sgId))
.then(data => console.log(data))

function createDatabase (dbName, sgId) {
  const params = {
    AllocatedStorage: 5,
    DBInstanceClass: 'db.t2.micro',
    DBInstanceIdentifier: dbName,
    Engine: 'mysql',
    DBName: dbName,
    VpcSecurityGroupIds: [ sgId ],
    MasterUsername: 'admin',
    MasterUserPassword: 'mypassword'
  }

  return new Promise((resolve, reject) => {
    rds.createDBInstance(params, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

function createSecurityGroup (dbName) {
  const params = {
    Description: `security group for ${dbName}`,
    GroupName: `${dbName}-db-sg`
  }

  return new Promise((resolve, reject) => {
    ec2.createSecurityGroup(params, (err, data) => {
      if (err) reject(err)
      else {
        // the new security groups id
        const sgGroupId = data.GroupId
        // the ec2 instance security group id
        getSecurityGroupId(ec2SgName)
        .then((ec2SgId) => {
          const params = {
            GroupId: sgGroupId,
            IpPermissions: [
              {
                IpProtocol: 'tcp',
                FromPort: 3306,
                ToPort: 3306,
                IpRanges: [
                  {
                    CidrIp: '72.182.3.87/32'
                  }
                ]
              },
              {
                IpProtocol: '-1',
                UserIdGroupPairs: [
                  {
                    GroupId: ec2SgId
                  }
                ]
              }
            ]
          }
          ec2.authorizeSecurityGroupIngress(params, (err, data) => {
            if (err) reject(err)
            else resolve(sgGroupId)
          })
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
