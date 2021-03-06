import React from 'react';
import { Page, Navbar, Block, BlockTitle, Row, List, Button, ListInput, ListItem } from 'framework7-react';
import {SVEGame} from 'webgames';

export default class extends React.Component {
  constructor(props) {
    super(props);  

    this.state = {
      newGame: {
        name: "",
        type: ""
      },
      foundGames: []
    };
  }

  render() {
    return (
      <Page>
        <Navbar title="Spiele-Hub" />
        <Block strong mediumInset>
          <BlockTitle>Spiel beitreten</BlockTitle>
          <List>
          {this.state.foundGames.map((game) => (
            <ListItem mediaItem
              key={game.name}
              title={game.name}
              subtitle={"Host: " + game.host + " Players: (" + game.playersCount + "/" + game.maxPlayers + ")"}
              footer={"Spiel: " + this.gameTypeToReadable(game.gameType)}
              link={`/playgame/${game.gameType}/${game.name}/join/`}
            >
            </ListItem>
          ))}
          </List>
          <Block largeInset strong>
              <Row tag="p">
                <Button className="col" raised fill onClick={this.updateGames.bind(this)}>Neu laden</Button>
              </Row>
          </Block>
        </Block>
        <Block largeInset>
          <BlockTitle>Spiel hosten</BlockTitle>
          <List>
            <ListInput
              label="Spielname"
              type="text"
              placeholder={"Spielname"}
              value={this.state.newGame.name}
              onInput={(e) => {
                this.setState({ newGame: {name: e.target.value, type: this.state.newGame.type }});
              }}
            ></ListInput>

            <ListInput
              label="Spieltyp"
              type="select"
              smartSelect
              smartSelectParams={{openIn: 'sheet'}}
              value={this.state.newGame.type}
              onInput={(e) => {
                this.setState({ newGame: {type: e.target.value, name: this.state.newGame.name }});
              }}
            >
              <option value="">Undefiniert</option>
              <option value="TheGame">The Game</option>
              <option value="Uno">Uno</option>
              <option value="Busdriver">Busfahrer</option>
              <option value="Wizard">Wizard</option>
            </ListInput>
            </List>
            <Block largeInset strong>
              <Row tag="p">
                <Button disabled={this.state.newGame.type == "" || this.state.newGame.name == ""} className="col" raised fill onClick={this.hostGame.bind(this)}>Hosten</Button>
              </Row>
            </Block>
        </Block>
      </Page>
    )}

    updateGames() {
      this.setState({foundGames: []});

      SVEGame.getGames().then(games => {
        this.setState({foundGames: games});
      });
    }

    gameTypeToReadable(type) {
      if (type == "thegame")
        return "The Game";

      if (type.toLowerCase() == "uno")
        return "Uno";

      if (type.toLowerCase() == "busdriver")
        return "Busfahrer";

      if (type.toLowerCase() == "wizard")
        return "Wizard";

      return type;
    }

    hostGame() {
      this.$f7router.navigate("/playgame/" + this.state.newGame.type + "/" + this.state.newGame.name + "/host/");
    }

    componentDidMount() {
      var self = this;
      this.$f7ready((f7) => {
        self.$f7.data.addLoginHook(() => {
          self.updateGames();
        });
      });
    }
};