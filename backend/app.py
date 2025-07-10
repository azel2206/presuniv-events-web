from flask import Flask, request, jsonify
from datetime import datetime, timedelta
import json
import os
from flask_cors import CORS 

app = Flask(__name__)

CORS(app) 

events = [
    {
        "id": 1,
        "title": "Tech Innovation Summit 2024",
        "category": "Academic",
        "date": "2025-01-15",
        "time": "09:00",
        "location": "Main Auditorium",
        "description": "Join industry leaders discussing the latest technological innovations and their impact on society.",
        "capacity": 200,
        "registrations": []
    },
    {
        "id": 2,
        "title": "Cultural Festival",
        "category": "Cultural",
        "date": "2025-01-20",
        "time": "18:00",
        "location": "Campus Grounds",
        "description": "Celebrate diversity through music, dance, and traditional performances from around the world.",
        "capacity": 500,
        "registrations": []
    },
    {
        "id": 3,
        "title": "Career Development Workshop",
        "category": "Workshop",
        "date": "2025-01-10",
        "time": "14:00",
        "location": "Conference Room A",
        "description": "Learn essential skills for job interviews, resume writing, and professional networking.",
        "capacity": 50,
        "registrations": []
    },
    {
        "id": 4,
        "title": "Sports Day Competition",
        "category": "Sports",
        "date": "2025-01-25",
        "time": "08:00",
        "location": "Sports Complex",
        "description": "Annual inter-department sports competition featuring various athletic events.",
        "capacity": 300,
        "registrations": []
    },
    {
        "id": 5,
        "title": "AI & Machine Learning Seminar",
        "category": "Seminar",
        "date": "2025-02-05",
        "time": "10:00",
        "location": "IT Building Hall",
        "description": "Explore the future of AI and machine learning with expert speakers from leading tech companies.",
        "capacity": 150,
        "registrations": []
    }
]

class EventManager:
    def __init__(self):
        self.events = events
        self.next_id = max([e['id'] for e in events]) + 1 if events else 1 
        self.next_registration_id = 1
    
    def get_all_events(self):
        return self.events
    
    def get_event_by_id(self, event_id):
        return next((e for e in self.events if e['id'] == event_id), None)
    
    def create_event(self, event_data):
        event = {
            'id': self.next_id,
            'title': event_data['title'],
            'category': event_data['category'],
            'date': event_data['date'],
            'time': event_data['time'],
            'location': event_data['location'],
            'description': event_data['description'],
            'capacity': int(event_data['capacity']),
            'registrations': [] 
        }
        self.events.append(event)
        self.next_id += 1
        return event
    
    def register_for_event(self, event_id, registration_data):
        event = self.get_event_by_id(event_id)
        if not event:
            return False, "Event not found"
        
        if len(event['registrations']) >= event['capacity']:
            return False, "Event is full"

        for reg in event['registrations']:
            if reg['studentId'] == registration_data['studentId']:
                return False, "Already registered"
        
        registration = {
            'id': self.next_registration_id,
            'eventId': event_id,
            'studentName': registration_data['studentName'],
            'studentId': registration_data['studentId'],
            'studentEmail': registration_data['studentEmail'],
            'studentPhone': registration_data['studentPhone'],
            'registrationDate': datetime.now().isoformat(),
            'status': 'confirmed' # status pendaftaran default
        }
        
        event['registrations'].append(registration)
        self.next_registration_id += 1
        return True, "Registration successful"
    
    def get_dashboard_stats(self):
        now = datetime.now()
        total_events = len(self.events)
        active_events = sum(1 for e in self.events if datetime.strptime(e['date'], '%Y-%m-%d').date() >= now.date())
        total_registrations = sum(len(e['registrations']) for e in self.events)
        
        next_week = now + timedelta(days=7)
        upcoming_events = sum(1 for e in self.events 
                              if now.date() <= datetime.strptime(e['date'], '%Y-%m-%d').date() <= next_week.date())
        
        return {
            'total_events': total_events,
            'active_events': active_events,
            'total_registrations': total_registrations,
            'upcoming_events': upcoming_events
        }
    
    def get_events_by_date(self, date_str):
        return [e for e in self.events if e['date'] == date_str]
    
    def get_events_by_month(self, year, month):
        return [e for e in self.events 
                if datetime.strptime(e['date'], '%Y-%m-%d').year == year 
                and datetime.strptime(e['date'], '%Y-%m-%d').month == month]
    
    def filter_events(self, category=None, search_term=None):
        filtered = self.events
        
        if category:
            filtered = [e for e in filtered if e['category'].lower() == category.lower()]
        
        if search_term:
            search_term = search_term.lower()
            filtered = [e for e in filtered if 
                        search_term in e['title'].lower() or 
                        search_term in e['description'].lower() or 
                        search_term in e['location'].lower()]
        
        return filtered
    
    def get_all_registrations(self):
        all_registrations = []
        for event in self.events:
            for registration in event['registrations']:
                reg_with_event = registration.copy()
                reg_with_event['eventTitle'] = event['title']
                reg_with_event['eventDate'] = event['date']
                all_registrations.append(reg_with_event)
        return all_registrations

event_manager = EventManager()

# ini code API manggil data
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    stats = event_manager.get_dashboard_stats()
    recent_events = event_manager.get_all_events()[:3] 
    return jsonify({
        'stats': stats,
        'recent_events': recent_events
    })

@app.route('/api/events', methods=['GET'])
def get_events():
    category = request.args.get('category')
    search = request.args.get('search')
    events = event_manager.filter_events(category, search)
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
def create_event():
    try:
        event_data = request.get_json()
        required_fields = ['title', 'category', 'date', 'time', 'location', 'description', 'capacity']
        if not all(field in event_data for field in required_fields):
            return jsonify({'success': False, 'error': 'Missing required event data'}), 400
        
        event = event_manager.create_event(event_data)
        return jsonify({'success': True, 'event': event}), 201 # ini 201 means berhasil membuat data 
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = event_manager.get_event_by_id(event_id)
    if event:
        return jsonify(event)
    return jsonify({'error': 'Event not found'}), 404

@app.route('/api/events/<int:event_id>/register', methods=['POST'])
def register_for_event(event_id):
    try:
        registration_data = request.get_json()
        
        required_fields = ['studentName', 'studentId', 'studentEmail', 'studentPhone']
        if not all(field in registration_data for field in required_fields):
            return jsonify({'success': False, 'error': 'Missing required registration data'}), 400
        
        success, message = event_manager.register_for_event(event_id, registration_data)
        if success:
            return jsonify({'success': True, 'message': message}), 200
        else:
            return jsonify({'success': False, 'message': message}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/registrations', methods=['GET'])
def get_registrations():
    registrations = event_manager.get_all_registrations()
    return jsonify(registrations)

@app.route('/api/calendar/<int:year>/<int:month>', methods=['GET'])
def get_calendar_events(year, month):
    events = event_manager.get_events_by_month(year, month)
    return jsonify(events)

@app.route('/api/calendar/date/<date_str>', methods=['GET'])
def get_events_by_date_api(date_str):
    events = event_manager.get_events_by_date(date_str)
    return jsonify(events)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
