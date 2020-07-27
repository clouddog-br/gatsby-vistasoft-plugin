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
         quantidade: 50
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
      console.log('error', error)
      throw error
   }
}

async function createImoveisNode(actions, createContentDigest, createNodeId, pluginOptions, data) {
   const { createNode } = actions
   Object.keys(data)
   .map(key => {
      let imovel = data[key]
      if (typeof imovel === 'object') {
         return {
            ...imovel,
            Slug: slugify(imovel.Empreendimento, { lower: true}),
            ValorDiaria: (imovel.ValorDiaria === '') ? undefined : Number(imovel.ValorDiaria),
            ValorDiariaPadrao: (imovel.ValorDiariaPadrao === '') ? undefined : Number(imovel.ValorDiariaPadrao),
            ValorVenda: (imovel.ValorVenda === '') ? undefined : Number(imovel.ValorVenda),
            ValorVendaPadrao: (imovel.ValorVendaPadrao === '') ? undefined : Number(imovel.ValorVendaPadrao),
            ValorLocacao: (imovel.ValorLocacao === '') ? undefined : Number(imovel.ValorLocacao),
            ValorLocacaoPadrao: (imovel.ValorLocacaoPadrao === '') ? undefined : Number(imovel.ValorLocacaoPadrao),
            MoedaIndice: (imovel.MoedaIndice === '') ? undefined : Number(imovel.MoedaIndice),
            Latitude: (imovel.Latitude === '') ? undefined : Number(imovel.Latitude),
            Longitude: (imovel.Longitude === '') ? undefined : Number(imovel.Longitude),
            ValorCondominio: (imovel.ValorCondominio === '') ? undefined : Number(imovel.ValorCondominio),
            ValorIptu: (imovel.ValorIptu === '') ? undefined : Number(imovel.ValorIptu),
         }
      }
   }) 
   .filter(el => el !== undefined)        
   .forEach(async imovel => {
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

      await createImovelDetalhe(actions, createContentDigest, createNodeId, pluginOptions, imovel.Codigo)
   })
}

async function createImovelDetalhe(actions, createContentDigest, createNodeId, pluginOptions, imovelCodigo) {
   console.log(`processando imovel detalhe: ${imovelCodigo}`)
   
   let pesquisa = {
      fields: ['Codigo', 
         { 'Foto': ['Codigo', 'FotoPequena', 'Foto', 'Destaque','Tipo', 'Descricao' ]}
      ],
   }

   try {
      let response = await axios.get(`${pluginOptions.url}/imoveis/detalhes?key=${pluginOptions.key}&imovel=${imovelCodigo}&pesquisa=${JSON.stringify(pesquisa)}`,
      {
         headers: {
            "accept": "application/json"
         }
      })
      createFotoNode(actions, createContentDigest, createNodeId, imovelCodigo, response.data)      
   } catch (error) {
      console.log("detalhe error", error)
      throw error
   }
}

function createFotoNode(actions, createContentDigest, createNodeId, imovelCodigo, data) {
   process.stdout.write(`processando imovel: ${imovelCodigo} - fotos: `);
   const { createNode } = actions
   Object.keys(data.Foto)
   .map(key => {
      return {
         ...data.Foto[key],
         Codigo: key,
         ImovelCodigo: imovelCodigo
      }
   })   
   .forEach(foto => {
      process.stdout.write('.');
      createNode({
      ...foto,
      id: createNodeId(`${VISTA_FOTO_NODE_TYPE}-${imovelCodigo}-${foto.Codigo}`),
      parent: null,
      children: [],
      internal: {
         type: VISTA_FOTO_NODE_TYPE,
         content: JSON.stringify(foto),
         contentDigest: createContentDigest(foto),
      },
      })
   })
   process.stdout.write(`\n`);
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
      const agencia = data[key]
      if (typeof agencia === 'object') {
         return {
            ...agencia,
            Slug:  slugify(agencia.Nome, { lower: true})
         }        
      }
   }) 
   .filter(el => el !== undefined)        
   .forEach(agencia => {
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
   console.log("initializing gatsby-vistasoft-plugin")

   if (pluginOptions.url === undefined) {
      throw Error("precisa definir a 'url' no plugin da vistasoft")
   }
   if (pluginOptions.key === undefined) {
      throw Error("precisa definir a 'key' no plugin da vistasoft")
   }

   console.log(`vista key: ${pluginOptions.key}`)
   console.log(`vista url: ${pluginOptions.url}`)
   
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
     }
     type VistaFoto implements Node {
         Codigo: ID!
         ImovelCodigo: String
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