 $requestData['fields'] = array(
                'Codigo', 'Moeda', 'Dormitorios',
                'TipoEndereco', 'Endereco', 'Numero', 'Complemento', 'Bloco', 'Bairro', 'Cidade', 'UF', 'CEP',
                'Categoria', 'Status', 'ValorVenda', 'ValorDiaria',
                'ValorAntigo', 'ValorAluguelSite',
                'ValorLocacao', 'MoedaIndice', 'FotoDestaque', 'BanheiroSocialQtd',
                'AreaTotal', 'AreaPrivativa', 'Vagas', 'Suites', 'BairroComercial',
                'MetragemAnt', 'Metragem1', 'Metragem2', 'Metragem3', 'DormitoriosAntigo', 'SuiteAntigo', 'VagasAntigo', 
                'TituloSite', 'Construtora', 'Descricao', 'AnoConstrucao', 'DataEntrega', 'Situacao',
                'Latitude', 'Longitude', 'Empreendimento', 'DescricaoEmpreendimento', 'Caracteristicas',
                'InfraEstrutura', 'ValorIptu', 'ValorCondominio', 'TituloSite','NomeCondominio','DataHoraAtualizacao', 'Tour360',
                array(
                    'Anexo' => array('Codigo', 'CodigoAnexo', 'Anexo', 'Arquivo', 'Descricao')
                ),
                array(
                    'AnexoEmpreendimento' => array('Codigo', 'CodigoAnexo', 'Anexo', 'Arquivo', 'Descricao')
                ),
                array(
                    'Video' => array('Codigo', 'VideoCodigo', 'Video', 'Destaque','Tipo')
                ),
                array(
                    'Foto' => array('Codigo', 'FotoPequena', 'Foto', 'Destaque','Tipo', 'Descricao')
                ),
                array(
                    'FotoEmpreendimento' => array('Codigo', 'FotoPequena', 'Foto', 'Destaque')
                ),
                array(
                    'Agencia' => array('Codigo', 'Nome', 'RazaoSocial', 'Cnpj', 'Uf', 'Cidade', 'Bairro', 'Endereco', 'EnderecoComplemento', 'EnderecoNumero', 'Fone', 'Pais')
                )
            );

            // Validacao para adicionar bairro comercial somente na requisicao, caso configurado
            if ( isset( $options['tipoBairro'] ) && $options['tipoBairro'] == 'Comercial' )
                $requestData['fields'][] = 'BairroComercial';

            $this->restApi->addRequestData('pesquisa', $requestData);
            $this->restApi->setRequestArgument('timeout',20);
            $this->restApi->setRequestUri('imoveis/detalhes');
