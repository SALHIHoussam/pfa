pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins-nexus')
        NEXUS_URL = "172.29.186.104:5001" // Remplacer par ton IP ou hostname Nexus Docker registry
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
                git branch: 'stagepfa', url: 'https://github.com/SALHIHoussam/pfa.git', credentialsId: 'GITHUB_TOKEN_PFA'
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
        stage('Docker Login') {
            steps {
                script {
                    echo "🔑 Connexion à DockerHub..."
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    echo "🔑 Connexion à Nexus Docker Registry..."
                    sh "echo ${NEXUS_CREDENTIALS_PSW} | docker login ${NEXUS_URL} -u ${NEXUS_CREDENTIALS_USR} --password-stdin"
                }
            }
        }
        stage('Deploy to Nexus') {
            steps {
                script {
                    echo "📦 Tag & push des images vers Nexus..."
                    sh "docker tag salhihoussam/backend:latest ${NEXUS_URL}/salhihoussam/backend:latest"
                    sh "docker tag salhihoussam/frontend:latest ${NEXUS_URL}/salhihoussam/frontend:latest"
                    sh "docker push ${NEXUS_URL}/salhihoussam/backend:latest"
                    sh "docker push ${NEXUS_URL}/salhihoussam/frontend:latest"
                }
            }
        }
        stage('Upload Artifacts to Nexus') {
            steps {
                script {
                    echo "⬆️ Upload des artifacts (build Flask & React) vers Nexus raw repository..."
                    sh "curl -u ${NEXUS_CREDENTIALS_USR}:${NEXUS_CREDENTIALS_PSW} --upload-file backend/backend.tar.gz http://${NEXUS_URL}/repository/pfa-backend-artifacts/backend.tar.gz"
                    sh "curl -u ${NEXUS_CREDENTIALS_USR}:${NEXUS_CREDENTIALS_PSW} --upload-file frontend/build.zip http://${NEXUS_URL}/repository/pfa-frontend-artifacts/build.zip"
                }
            }
        }
        stage('Docker Compose Up') {
            steps {
                script {
                    echo "🚀 Démarrage des containers Docker..."
                    sh 'sudo chown -R 200:200 nexus-data || true'
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
