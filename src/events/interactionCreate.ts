import { ApplicationCommandType, ComponentType, Events, Interaction, InteractionType, RepliableInteraction } from 'discord.js';
import { Event } from '../interfaces';
import configJSON from '../config.json';

const errorMessage = 'There was an error while executing this interaction.';
// Send a warning on error
async function replyError(error:unknown, interaction: RepliableInteraction) {
    if (error instanceof Error) {
        console.error(error);
        if (!configJSON.interactions.replyOnError) return;
        
        if(interaction.deferred) {
            await interaction.followUp({ content: errorMessage }).catch(console.error);
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
        }
        
    }
}

const event: Event = {
    name: Events.InteractionCreate,
    execute: async (client, interaction: Interaction) => {
        let interactionName:string;
        try {
            switch (interaction.type) {
            case InteractionType.ApplicationCommand:
        
                switch (interaction.commandType) {
                // Chat Input Command
                case ApplicationCommandType.ChatInput:
                    client.commands.get(interaction.commandName)?.execute(client, interaction);
                    break;
                    
                // Context Menu
                case ApplicationCommandType.Message:
                case ApplicationCommandType.User:
                    client.contextMenus.get(interaction.commandName)?.execute(client, interaction);
                    break;
                default:
                    break;
                }
                break;
            // Component (Button | Select Menu)
            case InteractionType.MessageComponent:
        
                if (!client.config.interactions.receiveMessageComponents) return;
                interactionName = client.config.interactions.splitCustomId ? interaction.customId.split('_')[0] : interaction.customId;
                    
                switch (interaction.componentType) {
                case ComponentType.Button:
                    client.buttons.get(interactionName)?.execute(client, interaction);
                    break;
            
                case ComponentType.ChannelSelect:
                case ComponentType.RoleSelect:
                case ComponentType.MentionableSelect:
                case ComponentType.StringSelect:
                    client.selectMenus.get(interactionName)?.execute(client, interaction);
                    break;
                default:
                    break;
                }
        
                break;
            // ModalSubmit
            case InteractionType.ModalSubmit:
                interactionName = interaction.customId.split(' ')[0];
                client.modals.get(interactionName)?.execute(client, interaction);   
                break;
            default:
                break;
            }
        } catch (error) {
            if(interaction.isRepliable()) replyError(error, interaction);
            else console.error(error);
        }
    }
        
};

export default event;