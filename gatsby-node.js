exports.onPreInit = () => console.log("Loaded gatsby-vistasoft-plugin")

const slugify = require('slugify')
const VISTA_IMOVEL_NODE_TYPE = `VistaImovel`
const VISTA_AGENCIA_NODE_TYPE = `VistaAgencia`
const VISTA_FOTO_NODE_TYPE = `VistaFoto`

const axios = require('axios')

async function createImoveis(actions, createContentDigest, createNodeId, pluginOptions, pagina) {
   pagina = pagina === undefined ? 1 : pagina
   console.log(`processando imoveis: ${pagina}`)

   let pesquisa = {
      fields: ["Codigo", "Empreendimento", 'BairroComercial', 'Categoria',  'Status', 
         'TipoEndereco', 'Endereco', 'Numero', 'Complemento', 'Bloco', 'Bairro', 'Cidade', 'UF', 'CEP',
         'Dormitorios', 'ValorVenda', 'ValorLocacao', 'ValorDiaria', 'MoedaIndice', 
         'FotoDestaque', 'FotoDestaquePequena', 'BanheiroSocialQtd','AreaTotal', 'AreaPrivativa','Vagas', 'Suites', 
         'FotoDestaqueEmpreendimento', 'FotoDestaqueEmpreendimentoPequena', 'Latitude','Longitude', 'DescricaoWeb',
         'DescricaoEmpreendimento', 'ValorCondominio', 'ValorIptu', 
         'TituloSite', 'Construtora', 'Descricao', 'AnoConstrucao', 'DataEntrega', 'Situacao', 'Caracteristicas',
         'InfraEstrutura', 'DataHoraAtualizacao'],
      paginacao: {
         pagina: pagina === undefined ? 1 : pagina,
         quantidade: 1
      }
   }

   try {
      let response = await axios.get(`${pluginOptions.url}/imoveis/listar?key=${pluginOptions.key}&showtotal=1&pesquisa=${JSON.stringify(pesquisa)}`,
      {
         headers: {
            "accept": "application/json"
         }
      })
      await createImoveisNode(actions, createContentDigest, createNodeId, pluginOptions, response.data)
      const { paginas } = response.data
      if (pagina < paginas && !pluginOptions.develop) {
         await createImoveis(actions, createContentDigest, createNodeId, pluginOptions, pagina+1)
      }
   } catch(error) {
      // if (typeof error === 'object') {
      //    console.log('error', error.response.data.message)
      // } else {
         console.log('error', error)
      // }
      
      throw error
   }
   
}

async function createImoveisNode(actions, createContentDigest, createNodeId, pluginOptions, data) {
   const { createNode } = actions
   Object.keys(data)
   .map(key => {
      let imovel = data[key]
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
         imovel.ValorCondominio = (imovel.ValorCondominio === '') ? undefined : Number(imovel.ValorCondominio)
         imovel.ValorIptu = (imovel.ValorIptu === '') ? undefined : Number(imovel.ValorIptu)
         return imovel
      }
   }) 
   .filter(el => el !== undefined)        
   .forEach(imovel => {
      //console.log("creating node for: "+ imovel.Codigo);
      imovelId = createNodeId(`${VISTA_IMOVEL_NODE_TYPE}-${imovel.Codigo}`);
      createNode({
      ...imovel,
      id: imovelId,
      parent: null,
      children: [],
         internal: {
            type: VISTA_IMOVEL_NODE_TYPE,
            content: JSON.stringify(imovel),
            contentDigest: createContentDigest(imovel),
         },
      })

      createImovelDetalhe(actions, createContentDigest, createNodeId, pluginOptions, imovelId, imovel.Codigo)
   })
}

async function createImovelDetalhe(actions, createContentDigest, createNodeId, pluginOptions, imovelId, imovel) {
   console.log(`processando imovel detalhe: ${imovelId}`)
   
   let pesquisa = {
      fields: ['Codigo', 
         { 'Foto': ['Codigo', 'FotoPequena', 'Foto', 'Destaque','Tipo', 'Descricao' ]}
      ],
   }

   try {
      let response = await axios.get(`${pluginOptions.url}/imoveis/detalhes?key=${pluginOptions.key}&imovel=${imovel}&pesquisa=${JSON.stringify(pesquisa)}`,
      {
         headers: {
            "accept": "application/json"
         }
      })
      createFotoNode(actions, createContentDigest, createNodeId, imovelId, response.data)
   } catch (error) {
      console.log("detalhe error", error)
   }
   
   
}

function createFotoNode(actions, createContentDigest, createNodeId, imovelId, data) {
   console.log(`createFotoNode imovelId: ${imovelId}`, data)
   const { createNode } = actions
   const imovel = data.Codigo
   Object.keys(data.Foto)
   .map(key => {
      let foto = data.Foto[key]
      foto.Codigo = key
      foto.ImovelId = imovelId
      return foto
   })   
   .forEach(foto => {
      console.log("creating node for: ", foto);
      createNode({
      ...foto,
      id: createNodeId(`${VISTA_FOTO_NODE_TYPE}-${foto.Codigo}`),
      parent: imovelId,
      children: [],
      internal: {
         type: VISTA_FOTO_NODE_TYPE,
         content: JSON.stringify(foto),
         contentDigest: createContentDigest(foto),
      },
      })
   })
}

async function createAgencias(actions, createContentDigest, createNodeId, pluginOptions, pagina) {
   pagina = pagina === undefined ? 1 : pagina
   console.log(`processando agencia: ${pagina}`)
   
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
      let agencia = data[key]
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
         TipoEndereco: String
         Endereco: String
         Numero: String
         UF: String
         Cidade: String
         Bairro: String
         BairroComercial: String
         Dormitorios: String 
         FotoDestaque: String
         FotoDestaquePequena: String
         FotoDestaqueEmpreendimento: String
         FotoDestaqueEmpreendimentoPequena: String
         DescricaoEmpreendimento: String
         TituloSite: String
         Construtora: String
         Descricao: String
         AnoConstrucao: String
         DataEntrega: String
         Situacao: String
         Caracteristicas: String
         InfraEstrutura: String
         DataHoraAtualizacao: String
         ValorCondominio: Int
         ValorIptu: Int
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
         Foto: VistaFoto @link(from: "vistaFoto.ImovelId" by: "id")
     }
     type VistaFoto implements Node {
         Codigo: ID!
         ImovelId: String
         FotoPequena: String
         Foto: String
         Destaque: String
         Tipo: String
         Descricao: String
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