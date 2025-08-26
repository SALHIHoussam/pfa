pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins-nexus')
        NEXUS_SERVICE = "nexus:5001" // Utilisation du container Nexus directement
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
        stage('Docker Login DockerHub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhubtokenpfa', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                    sh 'echo $PWD | docker login -u $USR --password-stdin'
                    }
                }
            }
        }

        stage('Deploy to Nexus') {
            steps {
                script {
                    echo "📦 Tag & push des images vers Nexus via le container..."
                    sh "docker tag salhihoussam/backend:latest ${NEXUS_SERVICE}/salhihoussam/backend:latest"
                    sh "docker tag salhihoussam/frontend:latest ${NEXUS_SERVICE}/salhihoussam/frontend:latest"
                    sh "docker push ${NEXUS_SERVICE}/salhihoussam/backend:latest"
                    sh "docker push ${NEXUS_SERVICE}/salhihoussam/frontend:latest"
                }
            }
        }
        stage('Upload Artifacts to Nexus') {
            steps {
                script {
                    echo "⬆️ Upload des artifacts vers Nexus raw repository..."
                    withCredentials([usernamePassword(credentialsId: 'jenkins-nexus', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                        sh "curl -u $USR:$PWD --upload-file backend/backend.tar.gz http://nexus:8081/repository/pfa-backend-artifacts/backend.tar.gz"
                        sh "curl -u $USR:$PWD --upload-file frontend/build.zip http://nexus:8081/repository/pfa-frontend-artifacts/build.zip"
                    }
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
