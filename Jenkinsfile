pipeline {
    agent any

    tools {
        nodejs "node-18"
    }

    triggers {
        githubPush()
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
                    // Désactive le traitement des warnings ESLint comme erreurs
                    sh 'CI=false npm install && CI=false npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                    python3 -m venv venv
                    source venv/bin/activate
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
    }
}
