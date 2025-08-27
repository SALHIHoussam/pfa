pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins') // Nexus username/password
        NEXUS_REPO_URL = "http://localhost:8081/repository/pfa-artifacts"
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
                    sh 'source venv/bin/activate && pytest || true'
                }
                dir('frontend') {
                    sh 'CI=false npm test -- --watchAll=false || true'
                }
            }
        }

        stage('Docker Compose Up (Nexus only)') {
            steps {
                script {
                    echo "🚀 Démarrage de Nexus uniquement..."
                    sh 'docker-compose -f docker-compose.yml up -d nexus'

                    echo "⏳ Attente que Nexus soit prêt..."
                    sh '''
                        for i in {1..60}; do
                            STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/service/rest/v1/status || true)
                            if [ "$STATUS" = "200" ]; then
                                echo "✅ Nexus est prêt !"
                                exit 0
                            fi
                            echo "⏳ Nexus pas encore prêt (status=$STATUS), nouvelle tentative..."
                            sleep 5
                        done
                        echo "❌ Nexus ne répond pas après 5 minutes."
                        exit 1
                    '''
                }
            }
        }

        stage('Package Artifacts') {
            steps {
                script {
                    echo "📦 Création des archives backend et frontend..."
                    sh 'tar -czf backend_src.tar.gz -C backend .'
                    sh 'tar -czf frontend_build.tar.gz -C frontend/build .'
                }
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

        stage('Docker Compose Up (All Services)') {
            steps {
                script {
                    echo "🚀 Démarrage complet des containers..."
                    sh 'docker-compose -f docker-compose.yml up -d'
                }
            }
        }

        stage('Verify Containers') {
            steps {
                script {
                    echo "🔍 Vérification des containers en cours d\'exécution..."
                    sh 'docker ps'
                }
            }
        }
    }

    post {
        always {
            echo "✅ Pipeline terminé."
        }
        failure {
            echo "❌ Pipeline échoué !"
        }
    }
}
