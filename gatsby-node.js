exports.onPreInit = () => console.log("Loaded gatsby-vistasoft-plugin")

const slugify = require('slugify')
const VISTA_IMOVEL_NODE_TYPE = `VistaImovel`
const VISTA_AGENCIA_NODE_TYPE = `VistaAgencia`

const axios = require('axios')

async function createImoveis(actions, createContentDigest, createNodeId, pluginOptions, pagina) {
   pagina = pagina === undefined ? 1 : pagina
   console.log(`processando: ${pagina}`)
   
   let pesquisa = {
      fields: ["Codigo", "Empreendimento", 'UF', 'Cidade', 'Bairro', 'BairroComercial', 'Categoria',  'Status', 
         'Dormitorios', 'ValorVenda', 'ValorLocacao', 'ValorDiaria', 'MoedaIndice', 
         'FotoDestaque', 'FotoDestaquePequena', 'BanheiroSocialQtd','AreaTotal', 'AreaPrivativa','Vagas', 'Suites', 
         'FotoDestaqueEmpreendimento', 'FotoDestaqueEmpreendimentoPequena', 'Latitude','Longitude', 'DescricaoWeb'],
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
   if (pagina < paginas && !pluginOptions.develop) {
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
         imovel.ValorDiaria = (imovel.ValorDiaria === '') ? undefined : Number(imovel.ValorDiaria)
         imovel.ValorDiariaPadrao = (imovel.ValorDiariaPadrao === '') ? undefined : Number(imovel.ValorDiariaPadrao)
         imovel.ValorVenda = (imovel.ValorVenda === '') ? undefined : Number(imovel.ValorVenda)
         imovel.ValorVendaPadrao = (imovel.ValorVendaPadrao === '') ? undefined : Number(imovel.ValorVendaPadrao)
         imovel.ValorLocacao = (imovel.ValorLocacao === '') ? undefined : Number(imovel.ValorLocacao)
         imovel.ValorLocacaoPadrao = (imovel.ValorLocacaoPadrao === '') ? undefined : Number(imovel.ValorLocacaoPadrao)
         imovel.MoedaIndice = (imovel.MoedaIndice === '') ? undefined : Number(imovel.MoedaIndice)
         imovel.Latitude = (imovel.Latitude === '') ? undefined : Number(imovel.Latitude)
         imovel.Longitude = (imovel.Longitude === '') ? undefined : Number(imovel.Longitude)
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

async function createAgencias(actions, createContentDigest, createNodeId, pluginOptions, pagina) {
   pagina = pagina === undefined ? 1 : pagina
   console.log(`processando: ${pagina}`)
   
   let pesquisa = {
      fields: ['CodigoEmpresa','Codigo', 'Nome', 'RazaoSocial', 'Cnpj', 'Uf', 'Cidade', 'Bairro', 'Endereco', 'Complemento', 'Numero', 'Ddd', 'Fone', 'E-mail', 'Creci','Cep', 'Fone2', 'Celular'],
      paginacao: {
         pagina: pagina === undefined ? 1 : pagina,
         quantidade: 50
      }
   }

   let response = await axios.get(`${pluginOptions.url}/agencias/listar?key=${pluginOptions.key}&showtotal=1&pesquisa=${JSON.stringify(pesquisa)}`,
   {
      headers: {
         "accept": "application/json"
      }
   })
   createAgenciasNode(actions, createContentDigest, createNodeId, response.data)
   const { paginas } = response.data
   if (pagina < paginas && !pluginOptions.develop) {
      await createAgencias(actions, createContentDigest, createNodeId, pluginOptions, pagina+1)
   }
}

function createAgenciasNode(actions, createContentDigest, createNodeId, data) {
   const { createNode } = actions
   Object.keys(data)
   .map(key => {
      const agencia = data[key]
      if (typeof agencia === 'object') {
         agencia.Slug = slugify(agencia.Nome, { lower: true})
         agencia.E_Mail 
         return agencia
      }
   }) 
   .filter(el => el !== undefined)        
   .forEach(agencia => {
      //console.log("creating node for: "+ imovel.Codigo);
      createNode({
      ...agencia,
      id: createNodeId(`${VISTA_AGENCIA_NODE_TYPE}-${agencia.Codigo}`),
      parent: null,
      children: [],
      internal: {
         type: VISTA_AGENCIA_NODE_TYPE,
         content: JSON.stringify(agencia),
         contentDigest: createContentDigest(agencia),
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
   await createAgencias(actions, createContentDigest, createNodeId, pluginOptions);
}

exports.createSchemaCustomization = ({ actions }) => {
   const { createTypes } = actions
   createTypes(`
     type VistaImovel implements Node {
       Codigo: ID!
       Slug: String
       Categoria: String 
       Status: String
       Empreendimento: String!
       UF: String
       Cidade: String
       Bairro: String
       BairroComercial: String
       Dormitorios: String 
       FotoDestaque: String
       FotoDestaquePequena: String
       FotoDestaqueEmpreendimento: String
       FotoDestaqueEmpreendimentoPequena: String
       BanheiroSocialQtd: String
       AreaTotal: String
       AreaPrivativa: String
       Vagas: String
       Suites: String
       Latitude: Float
       Longitude: Float
       DescricaoWeb: String
       ValorVenda: Int 
       ValorVendaPadrao: Int 
       ValorLocacao: Int
       ValorLocacaoPadrao: Int
       ValorDiaria: Int
       ValorDiariaPadrao: Int
       MoedaIndice: Int
     }
     type VistaAgencia implements Node {
      Codigo: ID!
      Slug: String
      CodigoEmpresa: String
      Nome: String
      RazaoSocial: String
      Cnpj: String
      Uf: String
      Cidade: String
      Bairro: String
      Endereco: String
      Complemento: String
      Numero: String
      Ddd: String
      Fone: String
      E_mail: String
      Creci: String
      Cep: String
      Fone2: String
      Celular: String
     }`)
 }