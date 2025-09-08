pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins')
        NEXUS_REPO_URL = "http://127.0.0.1:8081/repository/pfa-artifacts"
        COMPOSE_PROJECT_NAME = "pfa_project"
    }
    triggers {
        githubPush()
    }
    stages {
        stage('Clean Workspace') {
            steps {
                echo '🧹 Nettoyage du workspace...'
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                git branch: 'stagepfa', url: 'https://github.com/SALHIHoussam/pfa.git', credentialsId: 'github-token'
            }
        }

        stage('Build Frontend & Backend') {
            steps {
                dir('frontend') {
                    sh 'CI=false npm install && CI=false npm run build'
                }
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
                dir('backend') {
                    sh '''
                        . venv/bin/activate
                        python -m pytest --cov=backend --cov-report=xml:backend/coverage.xml || true
                    '''
                }
                dir('frontend') {
                    sh 'CI=false npm test -- --coverage --watchAll=false || true'
                }
            }
        }

        stage('Docker Compose Up (Nexus only)') {
            steps {
                script {
                    echo "🚀 Démarrage de Nexus uniquement..."
                    sh 'docker-compose -f docker-compose.yml up -d nexus'
                    sh '''
                        COUNT=0
                        until [ "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/service/rest/v1/status)" = "200" ]; do
                            COUNT=$((COUNT+1))
                            if [ $COUNT -ge 60 ]; then exit 1; fi
                            sleep 5
                        done
                    '''
                }
            }
        }

        stage('Docker Compose Up (SonarQube only)') {
            steps {
                script {
                    sh 'docker-compose -f docker-compose.yml up -d sonarqube'
                    sh '''
                        COUNT=0
                        until [ "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000)" = "200" ]; do
                            COUNT=$((COUNT+1))
                            if [ $COUNT -ge 60 ]; then exit 1; fi
                            sleep 5
                        done
                    '''
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('sonarqube-local') {
                    def scannerHome = tool 'sonar-scanner'
                    sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=sonar-project.properties"
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Compose Up (Prometheus only)') {
            steps {
                script {
                    sh 'docker-compose -f docker-compose.yml up -d prometheus'
                    sh '''
                        COUNT=0
                        until [ "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9090/-/ready)" = "200" ]; do
                            COUNT=$((COUNT+1))
                            if [ $COUNT -ge 60 ]; then exit 1; fi
                            sleep 5
                        done
                    '''
                }
            }
        }

        stage('Docker Compose Up (Grafana only)') {
            steps {
                script {
                    sh 'docker-compose -f docker-compose.yml up -d grafana'
                    sh '''
                        COUNT=0
                        until [ "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login)" = "200" ]; do
                            COUNT=$((COUNT+1))
                            if [ $COUNT -ge 60 ]; then exit 1; fi
                            sleep 5
                        done
                    '''
                }
            }
        }

        stage('Package Artifacts') {
            steps {
                sh '''
                    tar -czf backend_src.tar.gz -C backend .
                    tar -czf frontend_build.tar.gz -C frontend/build .
                '''
            }
        }

        stage('Upload Artifacts to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'jenkins', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                    sh """
                        curl -u $USR:$PWD --upload-file backend_src.tar.gz ${NEXUS_REPO_URL}/backend_src.tar.gz
                        curl -u $USR:$PWD --upload-file frontend_build.tar.gz ${NEXUS_REPO_URL}/frontend_build.tar.gz
                    """
                }
            }
        }

        stage('Docker Compose Build') {
            steps { sh 'docker-compose -f docker-compose.yml build --no-cache' }
        }

        stage('Docker Login') {
            steps {
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
            }
        }

        stage('Docker Compose Push') {
            steps { sh 'docker-compose -f docker-compose.yml push' }
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
