# IMPORTAÇÃO DAS BIBLIOTECAS
import cloudinary
import cloudinary.uploader
# FIM DA IMPORTAÇÃO DAS BIBLIOTECAS

# CONFIGURAÇÃO DA API DO CLOUDINARY
# Configuração

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)