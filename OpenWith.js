class App {
  constructor(kb, appNode) {
    this.kb = kb;
    this.appNode = appNode;
    this.ns = {
      solid: kb.ns("http://www.w3.org/ns/solid/terms#"),
      apps: kb.ns("https://jg10.solidcommunity.net/open-with/apps.ttl#"),
      rdfs: kb.ns("http://www.w3.org/2000/01/rdf-schema#"),
    };
  }

  uri(resourceUri, rego) {
    let uri;
    uri = this.uriFromPrefix(resourceUri);
    if (uri != null) return uri;

    uri = this.uriFromTemplate(resourceUri, rego);
    if (uri != null) return uri;

    return null;
  }

  uriFromPrefix(resourceUri) {
    let uriPrefix = this.kb.anyValue(
      this.appNode,
      this.ns.apps("uriPrefix"),
      null,
    );
    if (uriPrefix) {
      return uriPrefix + encodeURIComponent(resourceUri);
    }
    return null;
  }

  /**
   * Uses a regexp replacement to create an app uri from a resourceUri
   *
   * :app apps:resourceUriTemplate defines a RegExp to parse the provided resourceUri. Additional substitutions are provided:
   *    $instanceContainer is substituted by rego solid:instanceContainer (note that app may be used in several registrations)
   * :app apps:uriTemplate is used to create an app uri and can use regexp capture groups from resourceUriTemplate
   *
   * e.g.
   *
   * :Umai
   *     rdfs:label "Umai";
   *     apps:resourceUriTemplate ".*$instanceContainer(.*)#it";
   *     apps:uriTemplate "https://umai.noeldemartin.com/recipes/$1/".
   */
  uriFromTemplate(resourceUri, rego) {
    let resourceUriTemplate = this.kb.anyValue(
      this.appNode,
      this.ns.apps("resourceUriTemplate"),
      null,
    );
    if (resourceUriTemplate) {
      let uriTemplate = this.kb.anyValue(
        this.appNode,
        this.ns.apps("uriTemplate"),
        null,
      );
      if (rego) {
        let instanceContainer = this.kb.anyValue(
          rego,
          this.ns.solid("instanceContainer"),
        );
        resourceUriTemplate = resourceUriTemplate.replace(
          "$instanceContainer",
          instanceContainer,
        );
      }
      return resourceUri.replace(new RegExp(resourceUriTemplate), uriTemplate);
    }
  }
}

class OpenWith extends ReceiveResourceOS {
  update() {
    if (!this.resource || !this.os) {
      return false;
    }
    this.replaceChildren([]);

    let kb = this.os.store.graph;
    let ns = {
      solid: kb.ns("http://www.w3.org/ns/solid/terms#"),
      apps: kb.ns("https://jg10.solidcommunity.net/open-with/apps.ttl#"),
      rdfs: kb.ns("http://www.w3.org/2000/01/rdf-schema#"),
    };
    let thisTypes = this.resource.types().map((x) => x.uri);
    // Iterate through all solid:TypeRegistration-s for this resource's classes
    let apps = thisTypes
      .flatMap((t) => kb.each(null, ns.solid("forClass"), kb.sym(t)))
      .filter((rego) => rego != null)
      .flatMap((rego) =>
        kb.each(rego, ns.apps("apps"), null).flatMap((appNode) => {
          let app = new App(kb, appNode);
          return {
            uri: app.uri(this.resource.uri, rego),
            label: kb.anyValue(appNode, ns.rdfs("label"), null),
          };
        }),
      )
      .filter((app) => app != null && app.uri != null)
      //Concise but quadratic time solution from https://stackoverflow.com/questions/9229645/remove-duplicate-values-from-js-array
      //Assumes earlier registrations take precedence
      .filter(function (item, pos, self) {
        return self.indexOf(item) == pos;
      });
    //console.log(apps);

    if (apps.length > 0) {
      let select = document.createElement("ion-select");
      select.label = "Open with";
      select.placeholder = "App";
      select.interface = "action-sheet";
      select.classList.add("ion-padding-horizontal");
      select.addEventListener("ionChange", (e) => {
        window.open(e.detail.value, "_blank");
      });

      for (let app of apps) {
        let option = document.createElement("ion-select-option");
        option.value = app.uri;
        option.innerText = app.label;
        select.append(option);
      }
      this.replaceChildren(select);
    }
  }
}
