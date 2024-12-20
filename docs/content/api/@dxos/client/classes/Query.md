# Class `Query`
<sub>Declared in [packages/core/echo/echo-db/dist/types/src/query/query.d.ts:72]()</sub>


Predicate based query.

## Constructors
### [constructor(_queryContext, filter)]()




Returns: <code>[Query](/api/@dxos/client/classes/Query)&lt;T&gt;</code>

Arguments: 

`_queryContext`: <code>QueryContext</code>

`filter`: <code>[Filter](/api/@dxos/client/classes/Filter)&lt;any&gt;</code>



## Properties
### [filter]()
Type: <code>[Filter](/api/@dxos/client/classes/Filter)&lt;any&gt;</code>



### [objects]()
Type: <code>T[]</code>



### [results]()
Type: <code>QueryResult&lt;T&gt;[]</code>




## Methods
### [first()]()




Returns: <code>Promise&lt;T&gt;</code>

Arguments: none




### [run(\[timeout\])]()


Execute the query once and return the results.
Does not subscribe to updates.

Returns: <code>Promise&lt;OneShotQueryResult&lt;T&gt;&gt;</code>

Arguments: 

`timeout`: <code>object</code>


### [subscribe(\[callback\], \[opts\])]()


Subscribe to query results.
Queries that have at least one subscriber are updated reactively when the underlying data changes.

Returns: <code>[Subscription](/api/@dxos/client/types/Subscription)</code>

Arguments: 

`callback`: <code>function</code>

`opts`: <code>QuerySubscriptionOptions</code>


