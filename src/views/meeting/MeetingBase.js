import { mapGetters } from 'vuex'

export default {
  setup () {
    return {}
  },
  computed: {
    polls () {
      return this.getMeetingPolls(this.meetingId)
    },
    userRoles () {
      return this.meeting.current_user_roles || []
    },
    meetingPath () {
      return `/m/${this.meetingId}/${this.$slugify(this.meeting.title)}`
    },
    meeting () {
      return this.getMeeting(this.meetingId)
    },
    meetingId () {
      return Number(this.$route.params.id)
    },
    ...mapGetters('polls', ['getMeetingPolls']),
    ...mapGetters('meetings', ['getMeeting'])
  },
  methods: {
    hasRole (roleName) {
      return this.userRoles.includes(roleName)
    }
  }
}
