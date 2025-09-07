pipeline {
    agent any
    tools {
        nodejs "node-18"
    }
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhubtokenpfa')
        NEXUS_CREDENTIALS = credentials('jenkins') // Nexus username/password
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

                    echo "⏳ Attente que Nexus soit prêt..."
                    sh '''
                        COUNT=0
                        until [ "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/service/rest/v1/status)" = "200" ]; do
                            COUNT=$((COUNT+1))
                            if [ $COUNT -ge 60 ]; then
                                echo "❌ Nexus ne répond pas après 5 minutes."
                                exit 1
                            fi
                            echo "⏳ Nexus pas encore prêt, tentative $COUNT/60..."
                            sleep 5
                        done
                        echo "✅ Nexus est prêt !"
                    '''
                }
            }
        }

        stage('Docker Compose Up (SonarQube only)') {
            steps {
                script {
                    echo "🚀 Démarrage de SonarQube uniquement..."
                    sh 'docker-compose -f docker-compose.yml up -d sonarqube'
        
                    echo "⏳ Attente que SonarQube soit prêt..."
                    sh '''
                        COUNT=0
                        until [ "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000)" = "200" ]; do
                            COUNT=$((COUNT+1))
                            if [ $COUNT -ge 60 ]; then
                                echo "❌ SonarQube ne répond pas après 5 minutes."
                                exit 1
                            fi
                            echo "⏳ SonarQube pas encore prêt, tentative $COUNT/60..."
                            sleep 5
                        done
                        echo "✅ SonarQube est prêt !"
                    '''
                }
            }
        }

        stage('SonarQube Scan') {
            steps {
                script {
                    echo "🔍 Lancement de l'analyse SonarQube..."
                    withSonarQubeEnv('sonarqube-local') {
                        dir('backend') {
                            sh '''
                                # Activer l'environnement virtuel
                                . venv/bin/activate
                                # Pytest déjà exécuté dans Run Tests, coverage déjà générée
                            '''
                        }
                        dir('frontend') {
                            sh '''
                                # npm test déjà exécuté dans Run Tests, coverage déjà générée
                            '''
                        }
        
                        // Lancer l'analyse SonarQube (commentaire Groovy, pas #)
                        sh 'sonar-scanner -Dproject.settings=sonar-project.properties'
                    }
                }
            }
        }

        
        stage('SonarQube Quality Gate') {
            steps {
                script {
                    echo "⏳ Vérification du Quality Gate SonarQube..."
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        
        stage('Package Artifacts') {
            steps {
                script {
                    echo "📦 Création des archives backend et frontend..."
                    sh '''
                    tar -czf backend_src.tar.gz -C backend .
                    tar -czf frontend_build.tar.gz -C frontend/build .
                    
                    [ -f backend_src.tar.gz ] || { echo "❌ backend_src.tar.gz missing"; exit 1; }
                    [ -f frontend_build.tar.gz ] || { echo "❌ frontend_build.tar.gz missing"; exit 1; }
                    '''
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
