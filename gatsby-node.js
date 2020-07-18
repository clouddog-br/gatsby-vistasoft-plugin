exports.onPreInit = () => console.log("Loaded gatsby-vistasoft-plugin")

const slugify = require('slugify')
const VISTA_IMOVEL_NODE_TYPE = `VistaImovel`
const axios = require('axios')

async function createImoveis(actions, createContentDigest, createNodeId, pluginOptions, pagina) {
   pagina = pagina === undefined ? 1 : pagina
   console.log(`processando: ${pagina}`)
   
   let pesquisa = {
      fields: ["Codigo", "Empreendimento"],
      paginacao: {
         pagina: pagina === undefined ? 1 : pagina,
         quantidade: 50
      }
   }

   let response = await axios.get(`${pluginOptions.url}/imoveis/listar?key=${pluginOptions.key}&showtotal=1&pesquisa=${JSON.stringify(pesquisa)}`,
   {
      headers: {
         "accept": "application/json"
      }
   })
   createImoveisNode(actions, createContentDigest, createNodeId, response.data)
   const { paginas } = response.data
   if (pagina < paginas) {
      await createImoveis(actions, createContentDigest, createNodeId, pluginOptions, pagina+1)
   }
}

function createImoveisNode(actions, createContentDigest, createNodeId, data) {
   const { createNode } = actions
   Object.keys(data)
   .map(key => {
      const imovel = data[key]
      if (typeof imovel === 'object') {
         imovel.Slug = slugify(imovel.Empreendimento, { lower: true})
         return imovel
      }
   }) 
   .filter(el => el !== undefined)        
   .forEach(imovel => {
      //console.log("creating node for: "+ imovel.Codigo);
      createNode({
      ...imovel,
      id: createNodeId(`${VISTA_IMOVEL_NODE_TYPE}-${imovel.Codigo}`),
      parent: null,
      children: [],
      internal: {
         type: VISTA_IMOVEL_NODE_TYPE,
         content: JSON.stringify(imovel),
         contentDigest: createContentDigest(imovel),
      },
      })
   })
}

exports.sourceNodes = async ({
  actions,
  createContentDigest,
  createNodeId,
  getNodesByType,
}, pluginOptions) => {
   console.log("initializing",pluginOptions)

   if (pluginOptions.url === undefined) {
      throw Error("precisa definir a 'url' no plugin da vistasoft")
   }
   if (pluginOptions.key === undefined) {
      throw Error("precisa definir a 'key' no plugin da vistasoft")
   }
   await createImoveis(actions, createContentDigest, createNodeId, pluginOptions);
}

exports.createSchemaCustomization = ({ actions }) => {
   const { createTypes } = actions
   createTypes(`
     type VistaImovel implements Node {
       Codigo: ID!
       Slug: String
       Empreendimento: String!
     }`)
 }