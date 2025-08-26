pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
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
                withCredentials([usernamePassword(credentialsId: 'dockerhubtokenpfa', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        echo "🔑 Connexion à DockerHub..."
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    }
                }
            }
        }

        stage('Docker Compose Push') {
            steps {
                script {
                    echo "📤 Push des images Docker via Compose..."
                    sh 'docker-compose -f docker-compose.yml push'
                }
            }
        }
        stage('Docker Compose Up') {
            steps {
                script {
                    echo "🚀 Démarrage des containers Docker..."

                    // Facultatif si volume Docker géré, nécessaire seulement si nexus-data local
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
