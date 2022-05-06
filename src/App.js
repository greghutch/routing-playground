/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * App.js
 *
 * Basic react app container.  Handles state for the app and
 * propagation for state changes into the non-react map
 */
import React from "react";
import {
  onMetroChange,
  onAlgoChange,
  onInitializeRegen,
  registerHandlers,
} from "./Map";
import Select from "react-select";
import { algoOptions, metroOptions, getOriginDestinationPairs } from "./Data";
import { find, debounce, findIndex, filter } from "lodash";
import { RouteCharts } from "./RouteCharts";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { getQueryStringValue, setQueryStringValue } from "./queryString";

let keyboardListener;

class App extends React.Component {
  constructor(props) {
    super(props);

    function getDefault(collection, urlKey) {
      let defaultSelection = collection[0];
      const urlVal = getQueryStringValue(urlKey);
      if (urlVal) {
        const selectionFromURL = find(collection, { value: urlVal });
        if (selectionFromURL) {
          defaultSelection = selectionFromURL;
        }
      }
      console.log("returning defaultSelection for ", urlKey, defaultSelection);
      return defaultSelection;
    }

    this.state = {
      selectedMetroOption: getDefault(metroOptions, "metro"),
      selectedAlgoOption: getDefault(algoOptions, "algo"),
      showSpinner: true,
      chartData: {
        latencyData: [],
        durationData: [],
        distanceData: [],
      },
    };
    onMetroChange(this.state.selectedMetroOption.value);
    onAlgoChange(this.state.selectedAlgoOption.value);
    if (!keyboardListener) {
      keyboardListener = document.addEventListener(
        "keydown",
        debounce((event) => {
          console.log(
            `Key: ${event.key} with keycode ${event.keyCode} has been pressed`
          );
          const curAlgoIdx = findIndex(algoOptions, {
            value: this.state.selectedAlgoOption.value,
          });
          console.log("gots curAlgoIdx", curAlgoIdx);
          if (event.key == "ArrowDown" && curAlgoIdx < algoOptions.length - 1) {
            console.log("new Alog", algoOptions[curAlgoIdx + 1]);
            this.handleAlgoChange(algoOptions[curAlgoIdx + 1]);
          }
          if (event.key == "ArrowUp" && curAlgoIdx > 0) {
            console.log("new Alog", algoOptions[curAlgoIdx - 1]);
            this.handleAlgoChange(algoOptions[curAlgoIdx - 1]);
          }
        }),
        50
      );
    }

    this.handleMetroChange = (selectedMetroOption) => {
      this.setState({ showSpinner: true, selectedMetroOption }, () => {
        onMetroChange(this.state.selectedMetroOption.value);
        setQueryStringValue("metro", this.state.selectedMetroOption.value);
      });
    };

    this.handleAlgoChange = (selectedAlgoOption) => {
      this.setState({ showSpinner: true, selectedAlgoOption }, () => {
        onAlgoChange(this.state.selectedAlgoOption.value);
        setQueryStringValue("algo", this.state.selectedAlgoOption.value);
      });
    };

    this.regenerateData = () => {
      this.setState({ showSpinner: true }, () => {
        onInitializeRegen();
      });
    };

    // There must be a better way to handle cross
    // component communication
    registerHandlers((chartData) => {
      this.setState((prevState) => {
        prevState.showSpinner = false;
        prevState.chartData.latencyData = chartData.latencyData;
        prevState.chartData.distanceData = chartData.distanceData;
        prevState.chartData.durationData = chartData.durationData;
        return prevState;
      });
    });

    this.downloadData = async () => {
      console.log("generating route download ...");
      const routes = metroOptions.map((metro) => {
        console.log("working on ", metro.label);
        const metroData = {
          name: metro.label,
          pairs: getOriginDestinationPairs(undefined, metro.value, 10000, 0),
        };
        return metroData;
      });
      console.log("generated", routes);
      const fileName = "routes.json";
      const text = JSON.stringify(routes);
      let element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
      );
      element.setAttribute("download", fileName);

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    };
  }

  render() {
    return (
      <span>
        <Select
          value={this.state.selectedAlgoOption}
          onChange={this.handleAlgoChange}
          options={filter(algoOptions, { enabled: true })}
        />
        <div>
          <div style={{ width: "300px", float: "left" }}>
            <Select
              value={this.state.selectedMetroOption}
              onChange={this.handleMetroChange}
              options={filter(metroOptions, { enabled: true })}
            />
            <button onClick={this.regenerateData}>Regenerate</button>
            <Loader
              type="Audio"
              color="#00BFFF"
              height={100}
              width={100}
              timeout={60000} //60 secs
              visible={this.state.showSpinner}
            />
            <RouteCharts
              hideCharts={this.state.showSpinner}
              chartData={this.state.chartData}
            />
            <button onClick={this.downloadData}>Download</button>
          </div>
        </div>
      </span>
    );
  }
}

export { App as default };
