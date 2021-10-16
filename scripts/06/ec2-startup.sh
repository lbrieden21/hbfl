#!/bin/bash
curl --silent --location https://rpm.nodesource.com/setup_16.x | sudo bash -
yum install -y nodejs git
cd /home/ec2-user/hbfl
su ec2-user bash -c "npm i"
su ec2-user bash -c "npm run start"

# The above commands base64 encoded for entering into UserData
# IyEvYmluL2Jhc2gKY3VybCAtLXNpbGVudCAtLWxvY2F0aW9uIGh0dHBzOi8vcnBtLm5vZGVzb3VyY2UuY29tL3NldHVwXzE2LnggfCBzdWRvIGJhc2ggLQp5dW0gaW5zdGFsbCAteSBub2RlanMgZ2l0CmNkIC9ob21lL2VjMi11c2VyL2hiZmwKc3UgZWMyLXVzZXIgYmFzaCAtYyAibnBtIGkiCnN1IGVjMi11c2VyIGJhc2ggLWMgIm5wbSBydW4gc3RhcnQi
