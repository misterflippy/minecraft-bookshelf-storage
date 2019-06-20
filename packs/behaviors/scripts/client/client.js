var clientSystem = client.registerSystem(0, 0);
var queries = {};

// Setup which events to listen for
clientSystem.initialize = function () {
	// set up your listenToEvents and register client-side components here.

    queries.inventoryQuery = clientSystem.registerQuery();

    //clientSystem.listenForEvent("minecraft:client_entered_world", (eventData) => clientSystem.onClientEnter(eventData));
    clientSystem.listenForEvent("bookshelf_storage:inventory_update", (eventData) => clientSystem.onInventoryUpdate(eventData));
}

// per-tick updates
clientSystem.update = function () {
	// Any logic that needs to happen every tick on the client.

}

clientSystem.chat = function (message) {
    const eventData = clientSystem.createEventData("minecraft:display_chat_event");
    eventData.data.message = message;
    clientSystem.broadcastEvent("minecraft:display_chat_event", eventData);
};

clientSystem.onClientEnter = function (eventData) {
    let ents = clientSystem.getEntitiesFromQuery(queries.inventoryQuery);

    ents.forEach(ent => {
        //update inventory index molang variable to 0 to start
        if (ent.__identifier__ === "bookshelf_storage:bookshelf_storage_entity") {
            let molang = clientSystem.getComponent(ent, "minecraft:molang");
            molang.data["variable.bookshelfstorageinventoryindex"] = 0;
            clientSystem.applyComponentChanges(ent, molang);
        }
    });
    
}

clientSystem.onInventoryUpdate = function (eventData) {
    let ents = clientSystem.getEntitiesFromQuery(queries.inventoryQuery);

    let ent = ents.find(e => e.__unique_id__["64bit_low"] === eventData.data.entity_uid["64bit_low"] && e.__unique_id__["64bit_high"] === eventData.data.entity_uid["64bit_high"]);

    //update the molang variable
    if (ent) {
        let molang = clientSystem.getComponent(ent, "minecraft:molang");
        molang.data["variable.bookshelfstorageinventoryindex"] = eventData.data.inventory_fullness;
        clientSystem.applyComponentChanges(ent, molang);
    }
}