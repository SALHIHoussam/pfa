pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'stagepfa',
                    url: 'https://github.com/SALHIHoussam/pfa.git'
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install && npm run build'
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
                sh 'cd backend && source venv/bin/activate && pytest || true'
                sh 'cd frontend && npm test -- --watchAll=false || true'
            }
        }
    }
}
