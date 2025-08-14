pipeline {
    agent any

    triggers {
        // Déclenchement via webhook ou POST
        GenericTrigger(
            causeString: 'Triggered by Git webhook',
            genericVariables: [
                [key: 'ref', value: '$.ref']
            ],
            token: '	GITHUB_TOKEN_PFA', // à configurer dans Jenkins
            printContributedVariables: true,
            printPostContent: true
        )
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'stagepfa',
                    url: 'https://github.com/SALHIHoussam/pfa.git'
            }
        }

        stage('Frontend - Build React') {
            steps {
                dir('frontend') {
                    sh '''
                    npm install
                    npm run build
                    '''
                }
            }
        }

        stage('Backend - Setup Flask') {
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
                sh '''
                cd backend && source venv/bin/activate && pytest
                cd ../frontend && npm test -- --watchAll=false
                '''
            }
        }

        stage('Deploy') {
            steps {
                echo 'Déploiement en cours...'
                // Ici tu mets la commande pour copier sur ton serveur ou Docker
            }
        }
    }
}
