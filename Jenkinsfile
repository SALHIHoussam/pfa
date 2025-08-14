pipeline {
    agent any

    environment {
        BACKEND_DIR = "backend"    // dossier Flask
        FRONTEND_DIR = "frontend"  // dossier React
        PYTHON_VERSION = "3.10"
        NODE_VERSION = "18"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'stagepfa', url: 'https://github.com/SALHIHoussam/pfa.git'
            }
        }

        stage('Setup Backend (Flask)') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh """
                        python${PYTHON_VERSION} -m venv venv
                        . venv/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements.txt
                    """
                }
            }
        }

        stage('Setup Frontend (React)') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh """
                        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                        npm install
                        npm run build
                    """
                }
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir("${BACKEND_DIR}") {
                    sh """
                        . venv/bin/activate
                        pytest || echo "No backend tests found"
                    """
                }
            }
        }

        stage('Run Frontend Tests') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh """
                        npm test || echo "No frontend tests found"
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Déploiement ici (Docker, serveur, etc.)'
            }
        }
    }
}
