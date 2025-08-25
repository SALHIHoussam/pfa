pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_DOCKER_CREDS = credentials('jenkins-nexus') // ID Jenkins contenant user/pass Nexus
        COMPOSE_PROJECT_NAME = "pfa_project"
        NEXUS_URL = "http://172.29.186.104:5000" // Change selon ton réseau
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

        // ===== NOUVEAUX STAGES NEXUS =====

        stage('Nexus Docker Push') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'jenkins-nexus', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh """
                        echo $NEXUS_PASS | docker login http://172.29.186.104:5000 -u $NEXUS_USER --password-stdin
                        docker tag pfa_frontend:latest 172.29.186.104:5000/pfa_frontend:latest
                        docker tag pfa_backend:latest 172.29.186.104:5000/pfa_backend:latest
                        docker push 172.29.186.104:5000/pfa_frontend:latest
                        docker push 172.29.186.104:5000/pfa_backend:latest
                        """
                    }
                }
            }
        }

        stage('Nexus Backend Flask Publish') {
            steps {
                dir('backend') {
                    sh '''
                    source venv/bin/activate
                    python3 setup.py sdist bdist_wheel || echo "⚠ Aucun setup.py trouvé, étape ignorée"
                    pip install twine || true
                    twine upload --repository-url http://172.29.186.104:8081/repository/backend-flask dist/* || echo "⚠ Publication ignorée"
                    '''
                }
            }
        }

        stage('Nexus Frontend Publish') {
            steps {
                dir('frontend') {
                    sh '''
                    npm login --registry=http://172.29.186.104:8081/repository/frontend-npm/ <<EOF
                    ${NEXUS_DOCKER_CREDS_USR}
                    ${NEXUS_DOCKER_CREDS_PSW}
                    test@example.com
                    EOF
                    npm publish --registry=http://172.29.186.104:8081/repository/frontend-npm/ || echo "⚠ Publication ignorée"
                    '''
                }
            }
        }

        // ===== STAGES EXISTANTS =====

        stage('Docker Login') {
            steps {
                script {
                    echo "🔑 Connexion à DockerHub..."
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
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
