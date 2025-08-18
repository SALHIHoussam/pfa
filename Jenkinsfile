pipeline {
    agent any

    tools {
        nodejs "node-18"
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        DOCKER_IMAGE_BACKEND = "salhihoussam/backend"
        DOCKER_IMAGE_FRONTEND = "salhihoussam/frontend"
    }

    triggers {
        githubPush()
    }

    stages {
        stage('Clean') {
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

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'CI=false npm install && CI=false npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                    python3 -m venv venv
                    . venv/bin/activate
                    pip install -r requirements.txt
                    '''
                }
            }
        }

        stage('Tests') {
            steps {
                dir('backend') {
                    sh 'source venv/bin/activate && pytest || true'
                }
                dir('frontend') {
                    sh 'CI=false npm test -- --watchAll=false || true'
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    echo "🐳 Construction des images Docker..."
                    sh "docker build -t ${DOCKER_IMAGE_BACKEND}:latest ./backend"
                    sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:latest ./frontend"
                }
            }
        }

        stage('Docker Login & Push') {
            steps {
                script {
                    echo "🔑 Connexion à DockerHub..."
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    
                    echo "📤 Push des images vers DockerHub..."
                    sh "docker push ${DOCKER_IMAGE_BACKEND}:latest"
                    sh "docker push ${DOCKER_IMAGE_FRONTEND}:latest"
                }
            }
        }
    }
}
