# Deal Management System Integration Points

## Event System Integration

### Event Publisher Interface
```typescript
interface DealEventPublisher {
  onDealCreated(deal: Deal): Promise<void>;
  onDealUpdated(deal: Deal, changes: string[]): Promise<void>;
  onDealStageChanged(deal: Deal, from: DealStage, to: DealStage): Promise<void>;
  onParticipantAdded(deal: Deal, participant: any): Promise<void>;
  onDocumentAdded(deal: Deal, document: any): Promise<void>;
}
```

### Event Subscription Points
1. **WebSocket Events**
   ```typescript
   // Gateway subscription
   @WebSocketGateway()
   export class DealEventsGateway {
     @SubscribeMessage('subscribeToDeal')
     handleDealSubscription(client: Socket, dealId: string): void;
   }
   ```

2. **Notification Integration**
   ```typescript
   // Notification trigger points
   async function notifyParticipants(dealEvent: DealEvent): Promise<void>;
   async function notifyStageChange(deal: Deal, newStage: DealStage): Promise<void>;
   async function notifyDocumentRequired(deal: Deal, docType: string): Promise<void>;
   ```

## Service Integration Points

### Horse Service Integration
```typescript
// Required methods from HorseService
async checkHorseAvailability(horseId: string): Promise<boolean>;
async updateHorseStatus(horseId: string, status: string): Promise<void>;
async getHorseDetails(horseId: string): Promise<Horse>;
```

### User Service Integration
```typescript
// Required methods from UserService
async validateUserPermissions(userId: string, dealId: string): Promise<boolean>;
async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences>;
async getParticipantDetails(userId: string): Promise<UserProfile>;
```

### Document Service Integration
```typescript
// Required methods from DocumentService
async uploadDealDocument(dealId: string, file: any): Promise<string>;
async generateDealContract(dealId: string): Promise<Buffer>;
async validateDocument(dealId: string, docId: string): Promise<ValidationResult>;
```

## External Service Integration Points

### Payment Processing
```typescript
interface PaymentProcessor {
  initializePayment(deal: Deal): Promise<PaymentSession>;
  validatePayment(paymentId: string): Promise<PaymentStatus>;
  refundPayment(paymentId: string): Promise<RefundStatus>;
}
```

### Insurance Service
```typescript
interface InsuranceService {
  requestQuote(deal: Deal): Promise<InsuranceQuote>;
  bindPolicy(deal: Deal, quoteId: string): Promise<PolicyDetails>;
  validateCoverage(policyNumber: string): Promise<CoverageStatus>;
}
```

### Transportation Service
```typescript
interface TransportService {
  schedulePicking(deal: Deal): Promise<TransportSchedule>;
  updateTransportStatus(dealId: string, status: TransportStatus): Promise<void>;
  cancelTransport(scheduleId: string): Promise<void>;
}
```

## Database Integration Points

### Required Indices
```sql
CREATE INDEX idx_deals_horse_id ON deals(horse_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_created_by ON deals(created_by_id);
CREATE INDEX idx_deals_type ON deals(type);
```

### Required Triggers
```sql
-- Update timestamp trigger
CREATE TRIGGER update_deal_timestamp
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Audit log trigger
CREATE TRIGGER deal_audit_log
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_deal_changes();
```

## API Integration Points

### REST Endpoints
```typescript
// Required external API endpoints
POST   /api/deals
GET    /api/deals
GET    /api/deals/:id
PUT    /api/deals/:id
POST   /api/deals/:id/stage
POST   /api/deals/:id/documents
PUT    /api/deals/:id/participants
```

### WebSocket Events
```typescript
// Required WebSocket events
deal.created    -> Notify all participants
deal.updated    -> Notify affected participants
deal.stage      -> Notify all participants
deal.document   -> Notify relevant participants
deal.comment    -> Notify mentioned participants
```

## Authentication & Authorization Points

### Required Middleware
```typescript
// Auth middleware integration points
JwtAuthGuard           -> All deal endpoints
RoleGuard              -> Specific deal actions
PermissionGuard        -> Document access
ParticipantGuard       -> Deal access
```

### Permission Checks
```typescript
// Required permission checks
canViewDeal(userId: string, dealId: string): boolean;
canUpdateDeal(userId: string, dealId: string): boolean;
canAddParticipant(userId: string, dealId: string): boolean;
canUploadDocument(userId: string, dealId: string): boolean;
```

## Cache Integration Points

### Cache Keys
```typescript
// Required cache patterns
deal:{dealId}              -> Deal basic info
deal:{dealId}:participants -> Deal participants
deal:{dealId}:documents    -> Deal documents
deal:{dealId}:timeline     -> Deal timeline
user:{userId}:deals        -> User's deals
```

### Cache Invalidation Points
```typescript
// Required invalidation points
onDealUpdate(dealId: string): void;
onParticipantChange(dealId: string): void;
onDocumentUpdate(dealId: string): void;
onStageChange(dealId: string): void;
```

## Monitoring Integration Points

### Metrics
```typescript
// Required monitoring metrics
deal_creation_total        -> Counter
deal_stage_changes        -> Histogram
deal_completion_time      -> Histogram
deal_document_uploads     -> Counter
deal_participant_count    -> Gauge
deal_error_rate          -> Counter
```

### Health Checks
```typescript
// Required health check points
dealService.health()      -> Service health
database.health()        -> Database connectivity
cache.health()          -> Cache availability
documentService.health() -> Document service status
```

## Testing Integration Points

### Required Test Suites
```typescript
// Integration test points
DealCreationFlow          -> Test deal creation flow
DealProgressionFlow       -> Test stage progression
ParticipantManagement     -> Test participant handling
DocumentManagement        -> Test document handling
PaymentIntegration       -> Test payment processing
NotificationDelivery     -> Test notification system
```