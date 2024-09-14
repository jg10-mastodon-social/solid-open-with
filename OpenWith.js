class OpenWith extends ReceiveResourceOS {
  update() {
    if (!this.resource || !this.os) {
      return false;
    }
    this.replaceChildren([]);

    let thisTypes = this.resource.types().map(x => x.uri);
    let kb = this.os.store.graph;
    let apps = thisTypes
      .flatMap(t =>
        kb.each(
          null,
          kb.sym("http://www.w3.org/ns/solid/terms#forClass"),
          kb.sym(t)
        )
      )
      .filter(rego => rego != null)
      .flatMap(rego =>
        kb
          .each(
            rego,
            kb.sym("https://jg10.solidcommunity.net/open-with/apps.ttl#apps"),
            null
          )
          .flatMap(app => ({
            uriPrefix: kb.anyValue(
              app,
              kb.sym(
                "https://jg10.solidcommunity.net/open-with/apps.ttl#uriPrefix"
              ),
              null
            ),
            label: kb.anyValue(
              app,
              kb.sym("http://www.w3.org/2000/01/rdf-schema#label"),
              null
            )
          }))
      )
      .filter(app => app != null);
    console.log(apps);

    if (apps.length > 0) {
      let select = document.createElement("ion-select");
      select.label = "Open with";
      select.placeholder = "App";
      select.interface = "action-sheet";
      select.classList.add("ion-padding-horizontal");
      select.addEventListener("ionChange", e => {
        window.open(e.detail.value, "_blank");
      });

      for (let app of apps) {
        let uri = app.uriPrefix + encodeURIComponent(this.resource.uri);
        let option = document.createElement("ion-select-option");
        option.value = uri;
        option.innerText = app.label;
        select.append(option);
      }
      this.replaceChildren(select);
    }
  }
}
