import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommunicationRoutingModule } from './communication-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { SuggestionsPageComponent } from './pages/suggestions-page/suggestions-page.component';
import { TraitementSuggestionsPageComponent } from './pages/traitement-suggestions-page/traitement-suggestions-page.component';
import { VieEstudiantinePageComponent } from './pages/vie-estudiantine-page/vie-estudiantine-page.component';
import { GestionCommunicationsPageComponent } from './pages/gestion-communications-page/gestion-communications-page.component';
import { AnnoncesPageComponent } from './pages/annonces-page/annonces-page.component';
import { NouvelleAnnoncePageComponent } from './pages/nouvelle-annonce-page/nouvelle-annonce-page.component';
import { NotificationsPageComponent } from './pages/notifications-page/notifications-page.component';
import { DiscussionsPageComponent } from './pages/discussions-page/discussions-page.component';
import { ChatConversationItemComponent } from './pages/discussions-page/components/chat-conversation-item/chat-conversation-item.component';
import { ChatWindowComponent } from './pages/discussions-page/components/chat-window/chat-window.component';
import { ChatMessageBubbleComponent } from './pages/discussions-page/components/chat-message-bubble/chat-message-bubble.component';
import { ChatInputComponent } from './pages/discussions-page/components/chat-input/chat-input.component';
import { GroupInfoPanelComponent } from './pages/discussions-page/components/group-info-panel/group-info-panel.component';
import { CreateGroupModalComponent } from './pages/discussions-page/components/create-group-modal/create-group-modal.component';
import { NewMessageModalComponent } from './pages/discussions-page/components/new-message-modal/new-message-modal.component';
import { StickerPickerComponent } from './pages/discussions-page/components/sticker-picker/sticker-picker.component';

@NgModule({
  declarations: [
    SuggestionsPageComponent,
    TraitementSuggestionsPageComponent,
    VieEstudiantinePageComponent,
    GestionCommunicationsPageComponent,
    AnnoncesPageComponent,
    NouvelleAnnoncePageComponent,
    NotificationsPageComponent,
    DiscussionsPageComponent,
    ChatConversationItemComponent,
    ChatWindowComponent,
    ChatMessageBubbleComponent,
    ChatInputComponent,
    GroupInfoPanelComponent,
    CreateGroupModalComponent,
    StickerPickerComponent,
    NewMessageModalComponent
  ],
  imports: [
    CommonModule,
    CommunicationRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class CommunicationModule { }
