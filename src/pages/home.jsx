import React from 'react';
import {
  Page,
  Navbar,
  NavTitle,
  NavTitleLarge,
  NavRight,
  Link,
  Searchbar,
  Block,
  BlockTitle,
  List,
  ListItem,
  Row,
  Col,
  Button,
  SwipeoutActions,
  SwipeoutButton
} from 'framework7-react';
import Dom7 from 'dom7';
import {SVEGroup, SVEProject, SVEProjectQuery} from 'svebaselib';
import QRCodeScanner from './QRCodeScanner';
import NewGroupPopup from './NewGroupPopup';

export default class extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      groups: [],
      showProjects: false,
      home_display_list: []
    };
  }
  render() {
    return (
  <Page name="home">
    {/* Top Navbar */}
    <Navbar large sliding={false}>
      <NavTitle sliding>Willkommen {(this.$f7.data.getUser() !== undefined) ? this.$f7.data.getUser().getName() : ""}</NavTitle>
      <NavTitleLarge sliding>Willkommen {(this.$f7.data.getUser() !== undefined) ? this.$f7.data.getUser().getName() : ""}</NavTitleLarge>
      <NavRight>
        <Link iconF7="folder_badge_plus" tooltip="Neue Dokumentengruppe erstellen" onClick={() => this.$f7.data.getPopupComponent('NewGroupPopup').setComponentVisible(true)}></Link>
        <Link iconF7="qrcode_viewfinder" tooltip="Gruppe mit QR Code beitreten" onClick={this.joinGroup.bind(this)}></Link>
        <Link searchbarEnable=".searchbar-demo" iconIos="f7:search" iconAurora="f7:search" iconMd="material:search"></Link>
      </NavRight>
      <Searchbar
        className="searchbar-demo"
        expandable
        searchContainer=".search-list"
        searchIn=".item-title"
        onSearchbarSearch={(sb, q, pq) => { this.onSearch(sb, q, pq) }}
        onClickClear={(sb, pq) => { this.onClearSearch(sb) }}
        onClickDisable={(sb) => { this.onDisableSearch(sb) }}
        onSearchbarEnable={(sb) => { this.onEnableSearch(sb) }}
        onSearchbarDisable={(sb) => { this.onDisableSearch(sb) }}
        disableButton={!this.$theme.aurora}
        customSearch={true}
    ></Searchbar>
    </Navbar>

    {/* Page content */}
    <Block strong id="intro">
      <p>Willkommen im neuen SnowVision-Entertainment online Portal!</p>

      <p>Falls du es noch nicht getan hast, installiere diese App auf deinem Handy. Unter Apples iOS geht dies über die "Teilen" Funktion in der Safari Werkzeugleiste unten am Bildschirm. Das installieren der Webapp erlaubt es, weitere Funktionen zu nutzen.</p>
    </Block>

    <BlockTitle large>Deine Urlaubsgruppen</BlockTitle>
    <List className="search-list searchbar-found">
          {this.state.home_display_list.map((context) => (
            <ListItem
              swipeout
              id={context.group.getName()}
              key={context.group.getID()}
              title={context.group.getName()}
              link={`/context/${context.group.getID()}/`}
              onSwipeoutDeleted={this.onRemoveGroup.bind(this, context.group)}
            >
              <SwipeoutActions right={!this.$f7.device.desktop} style={(!this.$f7.device.desktop) ? {} : {display: "none"}}>
                <SwipeoutButton delete confirmText={`Möchten Sie die Gruppe ${context.group.getName()} wirklich löschen?`}>Löschen</SwipeoutButton>
              </SwipeoutActions>
              {(this.state.showProjects && context.projects.length > 0) ? (
                <Block slot="content" mediumInset>
                  <BlockTitle>Projekte</BlockTitle>
                  <List>
                    {context.projects.map((project) => (
                      <ListItem
                        id={project.getName()}
                        key={project.getID()}
                        title={project.getName()}
                        link={`/project/${project.getID()}/`}
                      >
                        <Img slot="media" src={project.getSplashImageURI()} width="60"/>
                      </ListItem>
                    ))}
                  </List>
                </Block>
              ) : ""}
            </ListItem>
          ))}
    </List>
    <Block strong>
      <Link href="/settings/" iconF7="gear" tooltip="Einstellungen">&nbsp;Einstellungen</Link>
    </Block>
    {(!this.$f7.device.standalone && (this.$f7.device.android || this.$f7.device.ios)) ? 
      <Block strong>
        <Link href="/install/" iconF7="square_arrow_down">&nbsp;App installieren</Link>
      </Block>
    : ""}
    {(this.$f7.data.isDebug()) ? 
      <Block strong>
        <Link onClick={this.simulateError.bind(this)}>Simuliere Fehler</Link>
      </Block>
    : ""}
    <Block strong>
      <Link href="/about/">Über die SVE-API</Link>
    </Block>
    <Block strong>
      <Link href="#" color="red" textColor="red" onClick={this.logOut.bind(this)}>Logout</Link>
    </Block>

    <QRCodeScanner
      onDecoded={(link) => {
        this.$f7.data.joinGroup(link);
        this.$f7.data.getPopupComponent('QRCodeScanner').setComponentVisible(false);
      }}
    />

    {(this.$f7.data.getUser() !== undefined) ?
      <NewGroupPopup
        owningUser={this.$f7.data.getUser()}
        onGroupCreated={(group) => { this.$f7.data.getPopupComponent('NewGroupPopup').setComponentVisible(false); this.updateContent(); }}
      />
    : ""}
  </Page>
    );
  }

  simulateError() {
    this.simulateError = undefined;
    this.forceUpdate();
  }

  joinGroup() {
    this.$f7.data.resetCameraPermissions(true);
    this.$f7.data.getPopupComponent('QRCodeScanner').setComponentVisible(true);
  }

  onRemoveGroup(group) {
    group.remove().then(v => {
      this.updateContent();
    });
  }

  logOut() {
    this.$f7.data.cleanUpLogInData();
    this.$f7.data.promptLogin();
  }

  onSearch(sb, query, prevQuery) {
    if (query === undefined || query.length == 0)
    {
      return;
    }
    SVEProjectQuery.query(query, this.$f7.data.getUser()).then(results => {
      let groups = results.filter(e => e.constructor.name === SVEGroup.name);
      let projects = results.filter(e => e.constructor.name === SVEProject.name);
      console.log("Query result: " + JSON.stringify(groups) + " prjs: -> " + JSON.stringify(projects));

      let list = [];
      groups.forEach(g => {
        let prjs = [];
        projects.filter(e => e.getGroup().getID() === g.getID()).forEach((e) => prjs.push(e));
        
        list.push({group: g, projects: prjs});
      });

      this.setState({home_display_list: list});
    });
  }

  onClearSearch(sb) {
    let list = [];
    this.state.groups.forEach(g => {
      list.push({
        group: g,
        projects: []
      });
    });
    this.setState({home_display_list: list});
  }

  onEnableSearch(sb) {
    Dom7("#intro").hide();
    this.onClearSearch(sb);
    this.setState({home_display_list: []});
    this.setState({showProjects: true});
  }

  onDisableSearch(sb) {
    Dom7("#intro").show();
    this.onClearSearch(sb);
    this.setState({showProjects: false});
  }

  updateContent() {
    var self = this;

    if(this.$f7.data.getUser() !== undefined) {
      SVEGroup.getGroupsOf(this.$f7.data.getUser()).then(gs => {
        self.setState({
          groups: gs
        });
        let list = [];
        gs.forEach(g => {
          list.push({
            group: g,
            projects: []
          });
        });
        self.setState({home_display_list: list});
      }, err => {
        this.$f7.dialog.alert("Can't fetch groups from server!", "Server down!");
        this.$f7.data.clearUser();
      });
    } else {
      //this.$f7.data.promptLogin();
    }
  }

  componentDidMount() {
    var self = this;
    this.$f7ready((f7) => {
      self.$f7.data.addLoginHook(() => {
        self.updateContent();
      });

      self.updateContent();

      Dom7(document).on('page:reinit', function (e) {
        self.updateContent();
      });
    });
  }
};