pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins')
        NEXUS_RAW_URL = "http://172.29.186.104:8081/repository/pfa-artifacts"
        NEXUS_DOCKER_REGISTRY = "172.29.186.104:5001"
        COMPOSE_PROJECT_NAME = "pfa_project"
    }
    triggers {
        githubPush()
    }
    stages {
        stage('Clean Workspace') {
            steps { cleanWs() }
        }

        stage('Checkout') {
            steps {
                git branch: 'stagepfa', url: 'https://github.com/SALHIHoussam/pfa.git', credentialsId: 'github-token'
            }
        }

        stage('Build Frontend & Backend') {
            steps {
                dir('frontend') { sh 'CI=false npm install && CI=false npm run build' }
                dir('backend') {
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('backend') { sh 'source venv/bin/activate && pytest || true' }
                dir('frontend') { sh 'CI=false npm test -- --watchAll=false || true' }
            }
        }

        stage('Docker Compose Up (Nexus only)') {
            steps {
                sh 'docker-compose -f docker-compose.yml up -d nexus'
                sh '''
                    COUNT=0
                    until [ "$(curl -s -o /dev/null -w "%{http_code}" http://172.29.186.104:8081/service/rest/v1/status)" = "200" ]; do
                        COUNT=$((COUNT+1))
                        if [ $COUNT -ge 60 ]; then
                            echo "❌ Nexus ne répond pas après 5 minutes."
                            exit 1
                        fi
                        sleep 5
                    done
                '''
            }
        }

        stage('Package Artifacts') {
            steps {
                sh '''
                    tar -czf backend_src.tar.gz -C backend .
                    tar -czf frontend_build.tar.gz -C frontend/build .
                    [ -f backend_src.tar.gz ] || { echo "❌ backend_src.tar.gz missing"; exit 1; }
                    [ -f frontend_build.tar.gz ] || { echo "❌ frontend_build.tar.gz missing"; exit 1; }
                '''
            }
        }

        stage('Upload Artifacts to Nexus Raw') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'jenkins', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                    sh """
                        curl -u $USR:$PWD --upload-file backend_src.tar.gz ${NEXUS_RAW_URL}/backend_src.tar.gz
                        curl -u $USR:$PWD --upload-file frontend_build.tar.gz ${NEXUS_RAW_URL}/frontend_build.tar.gz
                    """
                }
            }
        }

        stage('Docker Compose Build') {
            steps { sh 'docker-compose -f docker-compose.yml build --no-cache' }
        }

        stage('Docker Login Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'jenkins', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                    sh "docker login ${NEXUS_DOCKER_REGISTRY} -u $USR -p $PWD"
                }
            }
        }

        stage('Docker Push Nexus') {
            steps {
                sh '''
                    docker push 172.29.186.104:5001/backend:latest
                    docker push 172.29.186.104:5001/frontend:latest
                '''
            }
        }

        stage('Docker Login DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhubtokenpfa', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                    sh "docker login -u $USR -p $PWD"
                }
            }
        }

        stage('Docker Push DockerHub') {
            steps {
                sh '''
                    docker tag 172.29.186.104:5001/backend:latest salhihoussam/backend:latest
                    docker tag 172.29.186.104:5001/frontend:latest salhihoussam/frontend:latest
                    docker push salhihoussam/backend:latest
                    docker push salhihoussam/frontend:latest
                '''
            }
        }

        stage('Docker Compose Up (All Services)') {
            steps { sh 'docker-compose -f docker-compose.yml up -d' }
        }

        stage('Verify Containers') {
            steps { sh 'docker ps' }
        }
    }

    post {
        always { echo "✅ Pipeline terminé." }
        failure { echo "❌ Pipeline échoué !" }
    }
}
