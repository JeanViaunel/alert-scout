#!/bin/bash

# =============================================================================
# Alert Scout - 591 Apartment Tracker for Zhubei Area (12k-18k TWD)
# Cron Setup Script
# =============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================

# Alert Scout Configuration
API_URL="http://localhost:3000"
USER_EMAIL="ppython2020@proton.me"
USER_PASSWORD="111111"

# Target Criteria
CITY="hsinchu"
MIN_PRICE=12000
MAX_PRICE=18000
MIN_AREA=""
MAX_AREA=""
ROOMS=""
KEYWORDS=""

# Cron Schedule (Times: 8am, 12pm, 10pm)
MORNING_TIME="0 8 * * *"
NOON_TIME="0 12 * * *"
EVENING_TIME="0 22 * * *"

# Logging
LOG_FILE="$HOME/591-tracker.log"
LOCK_FILE="/tmp/591-scraper.lock"
MAX_LOG_SIZE=1048576  # 1MB

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $timestamp - $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $timestamp - $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $timestamp - $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_age=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE") ))
        if [ $lock_age -lt 3600 ]; then  # 1 hour
            log "WARN" "Another instance is already running (lock file age: ${lock_age}s)"
            log "WARN" "Remove lock file manually if needed: rm $LOCK_FILE"
            return 1
        else
            log "INFO" "Removing stale lock file (age: ${lock_age}s)"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Create lock file
    echo $$ > "$LOCK_FILE"
    return 0
}

release_lock() {
    if [ -f "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE"
        log "INFO" "Lock file released"
    fi
}

rotate_log() {
    if [ -f "$LOG_FILE" ]; then
        local file_size=$(stat -c%s "$LOG_FILE")
        if [ $file_size -gt $MAX_LOG_SIZE ]; then
            local backup="${LOG_FILE}.$(date +%Y%m%d_%H%M%S).backup"
            mv "$LOG_FILE" "$backup"
            log "INFO" "Log rotated to: $backup"
        fi
    fi
}

check_api_health() {
    log "INFO" "Checking Alert Scout API health..."
    
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" || echo "000")
    
    if [ "$health_response" = "200" ]; then
        log "INFO" "API is healthy (HTTP 200)"
        return 0
    else
        log "ERROR" "API is unhealthy (HTTP $health_response)"
        return 1
    fi
}

login_user() {
    log "INFO" "Logging in to Alert Scout..."
    
    local login_response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$USER_EMAIL\",
            \"password\": \"$USER_PASSWORD\"
        }")
    
    # Extract token from response
    TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | sed 's/\\//g')
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        log "ERROR" "Failed to authenticate (no token in response)"
        log "ERROR" "Login response: $login_response"
        return 1
    fi
    
    log "INFO" "Successfully authenticated (token: ${TOKEN:0:20}...)"
    return 0
}

create_alert() {
    log "INFO" "Creating 591 apartment alert..."
    
    local alert_response=$(curl -s -X POST "$API_URL/api/alerts" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"name\": \"591 Zhubei Area \$$MIN_PRICE-\$$MAX_PRICE\",
            \"type\": \"property\",
            \"city\": \"$CITY\",
            \"minPrice\": $MIN_PRICE,
            \"maxPrice\": $MAX_PRICE,
            \"rooms\": $ROOMS,
            \"minPing\": $MIN_AREA,
            \"maxPing\": $MAX_AREA,
            \"keywords\": $KEYWORDS,
            \"sources\": [\"591\"],
            \"checkFrequency\": \"1hour\"
        }")
    
    # Check if alert was created successfully
    if echo "$alert_response" | grep -q '"success": true'; then
        ALERT_ID=$(echo "$alert_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        log "INFO" "Alert created successfully (ID: $ALERT_ID)"
        echo "$ALERT_ID"
        return 0
    else
        log "ERROR" "Failed to create alert"
        log "ERROR" "Response: $alert_response"
        return 1
    fi
}

trigger_scrape() {
    log "INFO" "Triggering manual alert check..."
    
    local scrape_response=$(curl -s -X POST "$API_URL/api/alerts/check" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    # Check if scrape was triggered successfully
    if echo "$scrape_response" | grep -q '"success": true'; then
        log "INFO" "Alert check triggered successfully"
        
        # Show results if any
        local results=$(echo "$scrape_response" | grep -o '"newMatches":[0-9]*' || echo "0")
        if [ "$results" -gt 0 ]; then
            log "INFO" "Found $results new matches!"
        else
            log "INFO" "No new matches found"
        fi
        
        return 0
    else
        log "ERROR" "Failed to trigger alert check"
        log "ERROR" "Response: $scrape_response"
        return 1
    fi
}

show_status() {
    log "INFO" "Current system status:"
    log "INFO" "====================="
    log "INFO" "API URL: $API_URL"
    log "INFO" "User: $USER_EMAIL"
    log "INFO" "Target: $CITY (Price: \$$MIN_PRICE-\$$MAX_PRICE)"
    log "INFO" "Schedule: 8am, 12pm, 10pm"
    log "INFO" "====================="
}

display_menu() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}591 Apartment Tracker${NC}           ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}  Zhubei Area, 12k-18k TWD               ${BLUE}║${NC}"
    echo -e "${BLUE}╠══════════════════════════════════════╣${NC}"
    echo ""
    echo "  ${GREEN}1${NC}. Setup Alert (Create account/alert if needed)"
    echo "  ${GREEN}2${NC}. Trigger Manual Scrape"
    echo "  ${GREEN}3${NC}. Add Cron Jobs (8am, 12pm, 10pm)"
    echo "  ${GREEN}4${NC}. View Current Status"
    echo "  ${GREEN}5${NC}. Remove Existing Cron Jobs"
    echo "  ${GREEN}6${NC}. View Logs"
    echo "  ${GREEN}0${NC}. Exit"
    echo ""
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

# Create log directory
mkdir -p "$HOME/logs"

# Check for lock file
if check_lock; then
    exit 1
fi

# Release lock on exit (success or failure)
trap release_lock EXIT

# Rotate log if needed
rotate_log

# Display menu
display_menu

read -p "Select an option (0-6): " choice

case $choice in
    1)
        # Setup Alert
        echo ""
        log "INFO" "Starting alert setup process..."
        
        # Check API health first
        if ! check_api_health; then
            log "ERROR" "API is not accessible. Please start Alert Scout server first:"
            log "ERROR" "  cd ~/.openclaw/workspace/webdev/alert-scout && npm run dev"
            exit 1
        fi
        
        # Login
        if ! login_user; then
            exit 1
        fi
        
        # Create alert
        if ! create_alert; then
            exit 1
        fi
        
        log "INFO" "Alert setup completed successfully!"
        log "INFO" "You can now add cron jobs (option 3)"
        echo ""
        read -p "Press Enter to continue..."
        ;;
        
    2)
        # Trigger Manual Scrape
        log "INFO" "Triggering manual scrape..."
        
        if check_lock; then
            exit 1
        fi
        
        # Check API health
        if ! check_api_health; then
            log "ERROR" "API is not accessible"
            exit 1
        fi
        
        # Login
        if ! login_user; then
            exit 1
        fi
        
        # Trigger scrape
        if ! trigger_scrape; then
            exit 1
        fi
        
        log "INFO" "Manual scrape completed!"
        echo ""
        read -p "Press Enter to continue..."
        ;;
        
    3)
        # Add Cron Jobs
        echo ""
        log "INFO" "Setting up cron jobs (8am, 12pm, 10pm)..."
        echo ""
        log "WARN" "This will add cron jobs to your crontab."
        log "INFO" "Jobs will trigger 591 scraper at the specified times."
        log "INFO" ""
        log "INFO" "Times:"
        log "INFO" "  - 8:00 AM (Morning check)"
        log "INFO" "  - 12:00 PM (Noon check)"
        log "INFO" "  - 10:00 PM (Evening check)"
        log "INFO" ""
        log "INFO" "Criteria:"
        log "INFO" "  - Location: $CITY (Zhubei)"
        log "INFO" "  - Price: $MIN_PRICE-$MAX_PRICE TWD"
        log "INFO" "  - Frequency: Every hour"
        log "INFO" ""
        
        read -p "Do you want to proceed? (yes/no): " confirm
        
        if [[ "$confirm" != "yes" ]]; then
            log "INFO" "Cron setup cancelled."
            exit 0
        fi
        
        # Create temporary script for cron jobs
        local CRON_SCRIPT="$HOME/.591-scraper-job.sh"
        cat > "$CRON_SCRIPT" << 'CRON_EOF'
#!/bin/bash

# Log location
LOG_FILE="$HOME/591-tracker.log"

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo "[INFO] $timestamp - $message" >> "$LOG_FILE"
            ;;
        "WARN")
            echo "[WARN] $timestamp - $message" >> "$LOG_FILE"
            ;;
        "ERROR")
            echo "[ERROR] $timestamp - $message" >> "$LOG_FILE"
            ;;
    esac
}

# Main scrape function
main_scrape() {
    log "INFO" "Starting scheduled 591 scrape..."
    cd "$HOME/.openclaw/workspace/webdev/alert-scout"
    
    # Trigger API check
    local response=$(curl -s -X POST "http://localhost:3000/api/alerts/check" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer YOUR_TOKEN_HERE")
    
    if echo "$response" | grep -q '"success": true'; then
        local matches=$(echo "$response" | grep -o '"newMatches":[0-9]*' || echo "0")
        log "INFO" "Scrape completed! New matches: $matches"
    else
        log "ERROR" "Scrape failed"
    fi
}

# Run main function
main_scrape
CRON_EOF
        
        chmod +x "$CRON_SCRIPT"
        
        # Add cron jobs to crontab
        {
            crontab -l | grep -v "591-scraper"
            echo "$MORNING_TIME $CRON_SCRIPT"  # 8am
            echo "$NOON_TIME $CRON_SCRIPT"    # 12pm
            echo "$EVENING_TIME $CRON_SCRIPT"  # 10pm
        } | crontab -
        
        log "INFO" "Cron jobs added successfully!"
        log "INFO" "To view cron jobs: crontab -l"
        log "INFO" "To remove cron jobs: Edit crontab -e"
        log "INFO" "To check logs: tail -f $LOG_FILE"
        ;;
        
    4)
        # View Status
        show_status
        ;;
        
    5)
        # Remove Cron Jobs
        log "INFO" "Removing existing cron jobs..."
        crontab -l | grep -v "591-scraper" | crontab -
        log "INFO" "All 591 cron jobs removed."
        ;;
        
    6)
        # View Logs
        echo ""
        log "INFO" "Recent log entries:"
        echo "====================================================================="
        
        if [ -f "$LOG_FILE" ]; then
            tail -20 "$LOG_FILE"
        else
            log "INFO" "No log file found."
        fi
        
        echo ""
        log "INFO" "Full log location: $LOG_FILE"
        echo "====================================================================="
        ;;
        
    0)
        # Exit
        log "INFO" "Exiting 591 Apartment Tracker..."
        exit 0
        ;;
        
    *)
        log "ERROR" "Invalid option: $choice"
        exit 1
        ;;
esac
