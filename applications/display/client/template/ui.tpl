<div id="display-wrapper">
  <div id="header">
    <div id="title">{{title}}</div>
    <div id="status"></div>
  </div>
  <div id="displays">
  {{#each clusterMembers}}
    <div id="{{id}}" class="cluster-member">
      <span class="name">{{id}}</span>
      <ul class="messages"></ul>
      <ul class="connections"></ul>
    </div>
  {{/each}}
  </div>
  <div id="instructions">
    This simple application displays some of the cross-talk taking place
    between server processes as clients connect and disconnect or processes
    come up and go down.
  </div>
</div>
