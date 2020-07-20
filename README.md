# Plugin do Gatsby para VistaSoft

## Instalação
Instale utilizando o comando:

  npm i --save-dev gatsby-vistasoft-plugin

Depois adicione a configuração do plugin em gatsby-config.js

  plugins: [
    {
      resolve: "gatsby-vistasoft-plugin",
      options: {
        key: "######",
        url: "http://######.vistahost.com.br"
      }
    }

# Desenvolvimento

Para desenvolvimento incluimos um parâmetro:
  plugins: [
    {
      resolve: "gatsby-vistasoft-plugin",
      options: {
        key: "######",
        url: "http://######.vistahost.com.br",
        develop: true
      }
    }