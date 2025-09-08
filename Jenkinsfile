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
        stage('Clean Workspace & Fix Permissions') {
            steps {
                echo '🧹 Nettoyage du workspace et correction des permissions...'
                sh '''
                    echo "🔹 Reset workspace Git et suppression fichiers temporaires"
                    # Reset tout changement local
                    git reset --hard || true
                    git clean -fdx || true
                    # Donne tous les droits sur le workspace pour Jenkins
                    chmod -R 777 .
                '''
            }
        }

        stage('Checkout') {
            steps {
                echo '📥 Checkout sécurisé du repo...'
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

        stage('Start Docker Services & Wait') {
            steps {
                script {
                    def wait_for_service = { url, retries=60, delay=5 ->
                        for (int i=1; i<=retries; i++) {
                            def code = sh(script: "curl -s -o /dev/null -w \"%{http_code}\" ${url}", returnStdout: true).trim()
                            if (code == "200") { echo "✅ Service ready: ${url}"; return }
                            echo "⏳ Service pas prêt: ${url}, attempt ${i}/${retries}"
                            sleep delay
                        }
                        error "❌ Service ${url} ne répond pas après ${retries*delay} secondes"
                    }

                    // Démarre services séparément
                    echo "🚀 Démarrage de Nexus..."
                    sh 'docker-compose -f docker-compose.yml up -d nexus'
                    wait_for_service("http://127.0.0.1:8081/service/rest/v1/status")

                    echo "🚀 Démarrage de SonarQube..."
                    sh 'docker-compose -f docker-compose.yml up -d sonarqube'
                    wait_for_service("http://127.0.0.1:9000")

                    echo "🚀 Démarrage de Prometheus..."
                    sh 'docker-compose -f docker-compose.yml up -d prometheus'
                    wait_for_service("http://127.0.0.1:9090/-/ready")

                    echo "🚀 Démarrage de Grafana..."
                    sh 'docker-compose -f docker-compose.yml up -d grafana'
                    wait_for_service("http://127.0.0.1:3000/login")
                }
            }
        }

        stage('SonarQube Scan & Quality Gate') {
            steps {
                script {
                    echo "🔍 Analyse SonarQube..."
                    sh '/opt/sonar-scanner/bin/sonar-scanner -Dproject.settings=sonar-project.properties || true'
                    echo "⏳ Vérification Quality Gate..."
                    timeout(time: 15, unit: 'MINUTES') {
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

        stage('Docker Compose Build & Push') {
            steps {
                script {
                    echo "🐳 Build & push images Docker..."
                    sh 'docker-compose -f docker-compose.yml build --no-cache'
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    sh 'docker-compose -f docker-compose.yml push'
                }
            }
        }

        stage('Docker Compose Up (All Services)') {
            steps {
                script {
                    echo "🚀 Démarrage complet des containers..."
                    sh 'docker-compose -f docker-compose.yml up -d'
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
