pipeline {
    agent any

    tools {
        nodejs "node-18"
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins-nexus')
        NEXUS_URL = "172.29.186.104:8082"
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
                git branch: 'stagepfa',
                    url: 'https://github.com/SALHIHoussam/pfa.git',
                    credentialsId: 'GITHUB_TOKEN_PFA'
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
                        pip install -r requirements.txt
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('backend') {
                    sh 'source venv/bin/activate && pytest || true'
                }
                dir('frontend') {
                    sh 'CI=false npm test -- --watchAll=false || true'
                }
            }
        }

        stage('Docker Compose Build') {
            steps {
                script {
                    echo "🐳 Construction des images Docker avec Compose..."
                    sh 'docker-compose -f docker-compose.yml build --no-cache'
                }
            }
        }

        stage('Docker Login DockerHub') {
            steps {
                script {
                    echo "🔑 Connexion à DockerHub..."
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                }
            }
        }

        stage('Docker Push DockerHub') {
            steps {
                script {
                    echo "📤 Push des images Docker vers DockerHub..."
                    sh 'docker-compose -f docker-compose.yml push'
                }
            }
        }

        stage('Docker Login Nexus') {
            steps {
                script {
                    echo "🔑 Connexion à Nexus..."
                    sh "echo ${NEXUS_CREDENTIALS_PSW} | docker login ${NEXUS_URL} -u ${NEXUS_CREDENTIALS_USR} --password-stdin"
                }
            }
        }

        stage('Docker Push Nexus') {
            steps {
                script {
                    echo "📦 Push des images Docker vers Nexus..."
                    sh """
                        docker tag salhihoussam/backend:latest ${NEXUS_URL}/pfa/backend:latest
                        docker tag salhihoussam/frontend:latest ${NEXUS_URL}/pfa/frontend:latest
                        docker push ${NEXUS_URL}/pfa/backend:latest
                        docker push ${NEXUS_URL}/pfa/frontend:latest
                    """
                }
            }
        }

        stage('Docker Compose Up') {
            steps {
                script {
                    echo "🚀 Démarrage des containers Docker..."
                    sh 'docker-compose -f docker-compose.yml up -d'
                }
            }
        }

        stage('Verify Containers') {
            steps {
                script {
                    echo "🔍 Vérification des containers en cours d'exécution..."
                    sh 'docker ps'
                }
            }
        }
    }
}
