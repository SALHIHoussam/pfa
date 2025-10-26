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
        BUILD_TIMESTAMP = "${new Date().format('yyyyMMdd_HHmmss')}"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('🧹 Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('📥 Checkout') {
            steps {
                git branch: 'stagepfa', url: 'https://github.com/SALHIHoussam/pfa.git', credentialsId: 'github-token'
            }
        }

        stage('⚙️ Build Frontend & Backend') {
            steps {
                parallel (
                    "Frontend": {
                        dir('frontend') {
                            sh 'CI=false npm ci && CI=false npm run build'
                        }
                    },
                    "Backend": {
                        dir('backend') {
                            sh '''
                            python3 -m venv venv
                            . venv/bin/activate
                            pip install --upgrade pip
                            pip install -r requirements.txt
                            '''
                        }
                    }
                )
            }
        }

        stage('🧪 Run Tests') {
            steps {
                parallel (
                    "Backend Tests": {
                        dir('backend') {
                            sh '. venv/bin/activate && pytest --cov=backend --cov-report=xml:backend/coverage.xml || true'
                        }
                    },
                    "Frontend Tests": {
                        dir('frontend') {
                            sh 'CI=false npm test -- --coverage --watchAll=false || true'
                        }
                    }
                )
            }
        }

        stage('🚀 Start Monitoring Services') {
            steps {
                script {
                    def services = [
                        'nexus': 'http://127.0.0.1:8081',
                        'sonarqube': 'http://127.0.0.1:9000/api/system/status',
                        'prometheus': 'http://127.0.0.1:9090/metrics',
                        'grafana': 'http://127.0.0.1:3001/api/health'
                    ]
                    services.each { name, url ->
                        echo "⏳ Starting $name ..."
                        sh "docker-compose -f docker-compose.yml up -d ${name}"
                        timeout(time: 5, unit: 'MINUTES') {
                            waitUntil {
                                def status = sh(
                                    script: "curl -s -o /dev/null -w '%{http_code}' $url || echo 0",
                                    returnStdout: true
                                ).trim()
                                if (status == '200' || status == '302') {
                                    echo "✅ $name prêt !"
                                    return true
                                }
                                echo "⏳ $name non prêt (HTTP $status)"
                                sleep 5
                                return false
                            }
                        }
                    }
                }
            }
        }

        stage('🔍 SonarQube Scan') {
            steps {
                script {
                    withSonarQubeEnv('sonarqube-local') {
                        def scannerHome = tool 'sonar-scanner'
                        sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=sonar-project.properties"
                    }
                }
            }
        }

        stage('🧠 SonarQube Quality Gate') {
            steps {
                script {
                    timeout(time: 30, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }
        }

        stage('📦 Package Artifacts') {
            steps {
                sh '''
                tar -czf backend_src.tar.gz -C backend .
                tar -czf frontend_build.tar.gz -C frontend/build .
                '''
            }
        }

        stage('⬆️ Upload to Nexus') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'jenkins', usernameVariable: 'USR', passwordVariable: 'PWD')]) {
                    sh """
                        curl -u $USR:$PWD --upload-file backend_src.tar.gz ${NEXUS_REPO_URL}/backend_${BUILD_TIMESTAMP}.tar.gz
                        curl -u $USR:$PWD --upload-file frontend_build.tar.gz ${NEXUS_REPO_URL}/frontend_${BUILD_TIMESTAMP}.tar.gz
                    """
                }
            }
        }

        stage('🐳 Docker Build & Push') {
            steps {
                sh 'docker-compose -f docker-compose.yml build --no-cache'
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                sh 'docker-compose -f docker-compose.yml push'
            }
        }

        stage('🚀 Docker Up') {
            steps {
                sh 'docker-compose -f docker-compose.yml up -d'
                sh 'docker ps'
            }
        }
    }

    post {
        always {
            echo "✅ Pipeline terminé (Build : ${BUILD_TIMESTAMP})"
        }
        failure {
            echo "❌ Le pipeline a échoué. Vérifiez les logs SonarQube ou Docker."
        }
    }
}
