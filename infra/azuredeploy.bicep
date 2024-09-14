param staticSites_name string = 'azure-static-web-apps-001'

resource staticSite 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticSites_name
  location: 'East Asia'
  sku: {
    name: 'Free'
  }
  properties: {
  }
}
