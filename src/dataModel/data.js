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
 * Data.js
 *
 */
import { times, find } from "lodash";
import { randLatLngInPolygon } from "../utils/random";

// bounding polys generated manually in https://developers.google.com/maps/documentation/utilities/polylineutility
const metroOptions = [
  {
    enabled: true,
    value: "San_Fran_Neighorhood",
    label: "San Francisco",
    paths: [
      [
        { lat: 37.80006, lng: -122.50034 },
        { lat: 37.80594, lng: -122.3546 },
        { lat: 37.70345, lng: -122.35667 },
        { lat: 37.70352, lng: -122.50083 },
      ],
    ],
  },
  {
    enabled: true,
    value: "Amsterdam",
    label: "Amsterdam, Netherlands",
    paths: [
      [
        { lat: 52.4297033030251, lng: 4.793686580937697 },
        { lat: 52.409207537381405, lng: 5.032990128331033 },
        { lat: 52.380761917412165, lng: 4.977875670971678 },
        { lat: 52.30445762928882, lng: 5.061308354581498 },
        { lat: 52.286832922323846, lng: 4.7461268864958575 },
        { lat: 52.4297033030251, lng: 4.793686580937697 },
      ],
    ],
  },
];

function getMetroPolygon(map, metro, showMetroPolygon) {
  const paths = find(metroOptions, { value: metro }).paths;

  console.log("generating orig/dest for metro", metro, paths);
  const metroPolygon = new window.google.maps.Polygon({
    paths: paths,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
  });

  if (showMetroPolygon) {
    metroPolygon.setMap(map);
  }
  return metroPolygon;
}

function fitToMetroBounds(map, metro) {
  const metroPolygon = getMetroPolygon(map, metro, false);
  const metroBounds = metroPolygon.getBounds();
  map.fitBounds(metroBounds);
}

function getOriginDestinationPairs(map, metro, numRoutes, numWaypoints) {
  const showMetroPolygon = false; // useful for debugging
  const metroPolygon = getMetroPolygon(map, metro, showMetroPolygon);
  const randFn = randLatLngInPolygon(metroPolygon);
  const routes = times(numRoutes, () => {
    const origin = randFn();
    const destination = randFn();
    const waypoints = times(numWaypoints, randFn);
    return {
      origin,
      destination,
      waypoints,
    };
  });
  return routes;
}

export { metroOptions, getOriginDestinationPairs, fitToMetroBounds };
