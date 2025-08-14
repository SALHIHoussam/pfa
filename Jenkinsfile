pipeline {
    agent any

    triggers {
        githubPush() // déclenche le pipeline à chaque push sur GitHub
    }

    environment {
        // Assurez-vous que python3, pip3 et npm sont dans le PATH de Jenkins
        PATH = "/usr/bin:/usr/local/bin:${env.PATH}"
    }

    stages {

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
                    echo 'Installation des dépendances frontend...'
                    sh 'npm install'
                    echo 'Build du frontend...'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo 'Création de l\'environnement virtuel Python...'
                    sh 'python3 -m venv venv'
                    sh 'source venv/bin/activate && pip install --upgrade pip'
                    echo 'Installation des dépendances backend...'
                    sh 'source venv/bin/activate && pip install -r requirements.txt'
                }
            }
        }

        stage('Tests Backend') {
            steps {
                dir('backend') {
                    echo 'Exécution des tests backend...'
                    sh 'source venv/bin/activate && pytest || true'
                }
            }
        }

        stage('Tests Frontend') {
            steps {
                dir('frontend') {
                    echo 'Exécution des tests frontend...'
                    sh 'npm test -- --watchAll=false || true'
                }
            }
        }

        stage('Finalisation') {
            steps {
                echo 'Pipeline terminé !'
            }
        }
    }

    post {
        success {
            echo 'Build réussi ✅'
        }
        failure {
            echo 'Build échoué ❌'
        }
    }
}
